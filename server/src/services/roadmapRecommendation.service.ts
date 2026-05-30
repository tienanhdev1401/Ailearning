import { geminiService } from "./ai-chat/gemini.service";
import { userconfirmRepository } from "../repositories/userconfirm.repostitory";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { dayRepository } from "../repositories/day.repository";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

// ============================================================
// Types
// ============================================================

interface RoadmapSummary {
  id: number;
  levelName: string;
  description: string | null;
  overview: string | null;
  totalDays: number;
}

export interface RecommendationResult {
  recommendedRoadmapId: number;
  roadmapName: string;
  roadmapDescription: string | null;
  reason: string;
  tips: string[];
  userProfile: {
    reason: string;
    goal: any;
    topics: string[];
    level: string;
  };
}

// ============================================================
// Service
// ============================================================

export class RoadmapRecommendationService {

  /**
   * Main entry: get AI-powered roadmap recommendation for a user.
   */
  static async getRecommendation(userId: number): Promise<RecommendationResult> {
    // 1. Lấy dữ liệu multicheck của user
    const confirmedData = await userconfirmRepository.getConfirmedData(userId);
    if (!confirmedData) {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        "Người dùng chưa hoàn thành đánh giá trình độ (multicheck)."
      );
    }

    // 2. Lấy tất cả roadmaps + đếm số ngày
    const roadmaps = await roadmapRepository.find({ order: { id: "ASC" } });
    if (!roadmaps.length) {
      throw new ApiError(
        HttpStatusCode.NotFound,
        "Chưa có lộ trình nào trong hệ thống."
      );
    }

    const roadmapSummaries: RoadmapSummary[] = await Promise.all(
      roadmaps.map(async (rm) => {
        const dayCount = await dayRepository.count({
          where: { roadmap: { id: rm.id } },
        });
        return {
          id: rm.id,
          levelName: rm.levelName,
          description: rm.description,
          overview: rm.overview,
          totalDays: dayCount,
        };
      })
    );

    // 3. Gọi Gemini AI
    try {
      const aiResult = await this.callGeminiForRecommendation(
        confirmedData,
        roadmapSummaries
      );
      
      // Tìm roadmap được đề xuất
      const recommended = roadmaps.find((rm) => rm.id === aiResult.recommendedRoadmapId);
      if (!recommended) {
        // Fallback nếu AI trả id không hợp lệ
        return this.fallbackRecommendation(confirmedData, roadmapSummaries);
      }

      return {
        recommendedRoadmapId: recommended.id,
        roadmapName: recommended.levelName,
        roadmapDescription: recommended.description,
        reason: aiResult.reason,
        tips: aiResult.tips || [],
        userProfile: this.extractUserProfile(confirmedData),
      };
    } catch (error) {
      console.error("[RoadmapRecommendation] Gemini API failed, using fallback:", error);
      return this.fallbackRecommendation(confirmedData, roadmapSummaries);
    }
  }

  /**
   * Call Gemini API using the existing geminiService.
   */
  private static async callGeminiForRecommendation(
    confirmedData: any,
    roadmaps: RoadmapSummary[]
  ): Promise<{ recommendedRoadmapId: number; reason: string; tips: string[] }> {
    const roadmapList = roadmaps
      .map(
        (rm) =>
          `- ID: ${rm.id}, Tên: "${rm.levelName}", Mô tả: "${rm.description || "Không có"}", Tổng quan: "${rm.overview || "Không có"}", Số ngày: ${rm.totalDays}`
      )
      .join("\n");

    const prompt = `Bạn là một chuyên gia tư vấn học tiếng Anh. Dựa trên thông tin đánh giá trình độ của người dùng, hãy đề xuất lộ trình học phù hợp nhất.

## Thông tin người dùng:
- Lý do học: ${confirmedData.reason || "Không xác định"}
- Mục tiêu hàng ngày: ${JSON.stringify(confirmedData.goal) || "Không xác định"}
- Chủ đề quan tâm: ${JSON.stringify(confirmedData.topics) || "Không xác định"}
- Trình độ hiện tại: ${confirmedData.level || confirmedData.proficiency || "Không xác định"}

## Danh sách lộ trình có sẵn:
${roadmapList}

## Yêu cầu:
1. Chọn MỘT lộ trình phù hợp nhất từ danh sách trên dựa trên trình độ và mục tiêu của người dùng.
2. Giải thích ngắn gọn tại sao lộ trình này phù hợp (2-3 câu, bằng tiếng Việt).
3. Đưa ra 3-4 mẹo học tập cá nhân hóa dựa trên profile của người dùng (bằng tiếng Việt).

## Trả lời ĐÚNG định dạng JSON sau (KHÔNG thêm text nào khác ngoài JSON):
{
  "recommendedRoadmapId": <số ID của roadmap>,
  "reason": "<lý do đề xuất>",
  "tips": ["<mẹo 1>", "<mẹo 2>", "<mẹo 3>"]
}`;

    const text = await geminiService.generate({
      prompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
      thinkingBudget: 0,
    });

    // Trích xuất JSON từ response (có thể có markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Gemini returned non-JSON response: ${text.substring(0, 200)}`);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate
    if (
      typeof parsed.recommendedRoadmapId !== "number" ||
      typeof parsed.reason !== "string"
    ) {
      throw new Error("Invalid Gemini response structure");
    }

    return {
      recommendedRoadmapId: parsed.recommendedRoadmapId,
      reason: parsed.reason,
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    };
  }

  /**
   * Fallback: simple level-based matching when AI is unavailable.
   */
  private static fallbackRecommendation(
    confirmedData: any,
    roadmaps: RoadmapSummary[]
  ): RecommendationResult {
    const userLevel = (
      confirmedData.level ||
      confirmedData.proficiency ||
      ""
    ).toLowerCase();

    // Level mapping: thử match tên roadmap với level
    const levelKeywords: Record<string, string[]> = {
      a1: ["beginner", "a1", "cơ bản", "starter"],
      a2: ["elementary", "a2", "sơ cấp"],
      b1: ["intermediate", "b1", "trung cấp"],
      b2: ["upper intermediate", "b2", "trung cấp cao"],
      c1: ["advanced", "c1", "nâng cao"],
      c2: ["proficient", "c2", "thành thạo"],
    };

    // Tìm level key phù hợp
    let matchedLevelKey = "a1"; // default
    for (const [key, keywords] of Object.entries(levelKeywords)) {
      if (keywords.some((kw) => userLevel.includes(kw))) {
        matchedLevelKey = key;
        break;
      }
    }

    // Tìm roadmap phù hợp nhất
    let bestMatch = roadmaps[0];
    for (const rm of roadmaps) {
      const rmName = rm.levelName.toLowerCase();
      const keywords = levelKeywords[matchedLevelKey] || [];
      if (keywords.some((kw) => rmName.includes(kw))) {
        bestMatch = rm;
        break;
      }
    }

    const profile = this.extractUserProfile(confirmedData);

    return {
      recommendedRoadmapId: bestMatch.id,
      roadmapName: bestMatch.levelName,
      roadmapDescription: bestMatch.description,
      reason: `Dựa trên trình độ ${confirmedData.level || "của bạn"}, lộ trình "${bestMatch.levelName}" là phù hợp nhất để bạn bắt đầu hành trình học tập.`,
      tips: [
        `Hãy dành ${profile.goal?.time || "ít nhất 10 phút"} mỗi ngày để luyện tập đều đặn.`,
        "Kết hợp nghe, nói, đọc, viết để phát triển toàn diện kỹ năng.",
        "Đừng ngại sai – mỗi lỗi sai là một bài học quý giá!",
      ],
      userProfile: profile,
    };
  }

  /**
   * Extract a clean user profile from raw confirmedData.
   */
  private static extractUserProfile(confirmedData: any) {
    return {
      reason: confirmedData.reason || "Không xác định",
      goal: confirmedData.goal || null,
      topics: Array.isArray(confirmedData.topics)
        ? confirmedData.topics
        : typeof confirmedData.topics === "string"
          ? JSON.parse(confirmedData.topics)
          : [],
      level: confirmedData.level || confirmedData.proficiency || "Không xác định",
    };
  }
}
