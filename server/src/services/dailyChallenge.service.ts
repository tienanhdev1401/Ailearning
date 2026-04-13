import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import { activityRepository } from "../repositories/activity.repostitory";
import { userProgressRepository } from "../repositories/userProgress.repository";
import { minigameRepository } from "../repositories/minigame.repository";
import MiniGameType from "../enums/minigameType.enum";
import { MiniGame } from "../models/minigame";
import { dayRepository } from "../repositories/day.repository";
import { Not, In } from "typeorm";

export class DailyChallengeService {
  /**
   * Tính toán phần trăm hoàn thành của roadmap cho user
   */
  private static async calculateRoadmapProgress(userId: number, roadmapId: number): Promise<number> {
    const totalActivities = await activityRepository
      .createQueryBuilder("activity")
      .innerJoin("activity.day", "day")
      .innerJoin("day.roadmap", "roadmap")
      .where("roadmap.id = :roadmapId", { roadmapId })
      .getCount();

    if (totalActivities === 0) return 0;

    const completedActivities = await userProgressRepository
      .createQueryBuilder("up")
      .innerJoin("up.activity", "activity")
      .innerJoin("activity.day", "day")
      .innerJoin("day.roadmap", "roadmap")
      .where("up.userId = :userId", { userId })
      .andWhere("up.isCompleted = :isCompleted", { isCompleted: true })
      .andWhere("roadmap.id = :roadmapId", { roadmapId })
      .getCount();

    return completedActivities / totalActivities;
  }

  /**
   * Lấy trạng thái Daily Challenge hiện tại
   */
  static async getChallengeStatus(userId: number, roadmapId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({
      where: { user: { id: userId }, roadmap: { id: roadmapId } }
    });

    if (!enrollment) throw new ApiError(HttpStatusCode.NotFound, "Chưa đăng ký roadmap này");

    const progress = await this.calculateRoadmapProgress(userId, roadmapId);
    // const isEligible = progress >= 0.2; // 20%
    const isEligible = true; // Bắt buộc là true để TEST (Gốc: progress >= 0.2)

    // Logic kiểm tra streak và reset nếu quá 24h
    let currentStreak = enrollment.streak;
    const now = new Date();

    if (enrollment.dailyChallengeCompletedAt) {
      const lastCompleted = new Date(enrollment.dailyChallengeCompletedAt);
      const diffInHours = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);

      // Nếu quá 48h (bỏ lỡ cả ngày hôm qua) thì reset streak
      if (diffInHours > 48) {
        currentStreak = 0;
        enrollment.streak = 0;
        await roadmapEnrollementRepository.save(enrollment);
      }
    }

    const isCompletedToday = enrollment.dailyChallengeCompletedAt
      ? new Date(enrollment.dailyChallengeCompletedAt).toDateString() === now.toDateString()
      : false;

    return {
      progress: Math.round(progress * 100),
      isEligible,
      streak: currentStreak,
      isCompletedToday,
      unlockRequirement: 20
    };
  }

  /**
   * Tạo bộ câu hỏi cho Daily Challenge dựa trên độ khó
   */
  static async generateChallenge(userId: number, roadmapId: number) {
    const status = await this.getChallengeStatus(userId, roadmapId);
    if (!status.isEligible) throw new ApiError(HttpStatusCode.Forbidden, "Chưa đủ 20% tiến độ để mở khóa thử thách");
    if (status.isCompletedToday) throw new ApiError(HttpStatusCode.BadRequest, "Bạn đã hoàn thành thử thách hôm nay rồi");

    // Tính level độ khó (1-3)
    // Càng gần về cuối roadmap (progress cao) và streak cao thì càng khó
    const level = Math.min(3, Math.max(1, Math.floor((status.progress / 20) + (status.streak / 5))));

    const gamesCount = 3 + level * 2; // Level 1: 5 games, Level 3: 9 games

    // Phân loại độ khó của các type minigame
    const complexityMap: Record<string, "easy" | "medium" | "hard"> = {
      [MiniGameType.MATCH_IMAGE_WORD]: "easy",
      [MiniGameType.TRUE_FALSE]: "medium",
      [MiniGameType.SENTENCE_BUILDER]: "medium",
      [MiniGameType.LISTEN_SELECT]: "hard",
      [MiniGameType.TYPING_CHALLENGE]: "hard"
    };

    // Lấy tất cả bài kiểm tra (bỏ các minigame học thuyết và bài thi dài)
    const testGames = await minigameRepository.find({
      where: {
        activity: { day: { roadmap: { id: roadmapId } } },
        type: Not(In([
          MiniGameType.LESSON,
          MiniGameType.WATCH_VIDEO,
          MiniGameType.FLIP_CARD,
          MiniGameType.EXAM
        ]))
      },
      relations: ["activity", "activity.day"]
    });

    if (testGames.length === 0) throw new ApiError(HttpStatusCode.InternalServerError, "Không tìm thấy đủ bài kiểm tra để tạo thử thách");

    // Lọc và gán độ khó ảo cho từng game dựa trên type và vị trí trong roadmap
    const scoredGames = testGames.map(game => {
      const typeDifficulty = complexityMap[game.type] || "medium";
      const dayWeight = game.activity.day.dayNumber; // Ngày càng cao thì càng khó

      let score = dayWeight;
      if (typeDifficulty === "hard") score += 20;
      if (typeDifficulty === "medium") score += 10;

      return { game, score };
    });

    // Sắp xếp theo score
    scoredGames.sort((a, b) => b.score - a.score);

    // Chọn game dựa trên level
    // Level 1: Chọn đám dễ (score thấp). Level 5: Chọn đám khó (score cao)
    let selectedGames: MiniGame[] = [];

    // Thuật toán chọn lọc:
    // 30% bộ câu hỏi là "Mastery" - bốc từ các Day cao nhất đã học
    // 70% bộ câu hỏi là "Review" - bốc từ các Day cũ hơn
    const masteryCount = Math.ceil(gamesCount * 0.3);
    const reviewCount = gamesCount - masteryCount;

    // Lấy mastery (top score)
    selectedGames.push(...scoredGames.slice(0, masteryCount).map(sg => sg.game));

    // Lấy review (random các bài khác)
    const remainingPool = scoredGames.slice(masteryCount);
    for (let i = 0; i < reviewCount && remainingPool.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * remainingPool.length);
      selectedGames.push(remainingPool[randomIndex].game);
      remainingPool.splice(randomIndex, 1);
    }

    // Trộn lại lần cuối
    selectedGames.sort(() => Math.random() - 0.5);

    return {
      level,
      gamesCount,
      games: selectedGames,
      hearts: level >= 3 ? 3 : null, // Cấp độ 3 có giới hạn mạng
      timer: level >= 2 ? 60 : null  // Cấp độ 2+ có đếm ngược
    };
  }

  /**
   * Xử lý sau khi hoàn thành thử thách
   */
  static async submitChallenge(userId: number, roadmapId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({
      where: { user: { id: userId }, roadmap: { id: roadmapId } }
    });

    if (!enrollment) throw new ApiError(HttpStatusCode.NotFound, "Chưa đăng ký roadmap này");

    const now = new Date();

    // Nếu đã hoàn thành hôm nay thì thôi
    if (enrollment.dailyChallengeCompletedAt &&
      new Date(enrollment.dailyChallengeCompletedAt).toDateString() === now.toDateString()) {
      return { streak: enrollment.streak, message: "Hôm nay bạn đã làm rồi!" };
    }

    // Tăng streak
    enrollment.streak += 1;
    enrollment.dailyChallengeCompletedAt = now;
    enrollment.lastActivityAt = now;

    await roadmapEnrollementRepository.save(enrollment);

    return {
      streak: enrollment.streak,
      completedAt: enrollment.dailyChallengeCompletedAt
    };
  }
}
