// services/minigame.service.ts
import { MiniGame } from "../models/minigame";
import { MatchImageWordMiniGame } from "../models/minigameImp/match-image-word-minigame";
import { LessonMiniGame } from "../models/minigameImp/lesson-minigame";
import { ExamMiniGame } from "../models/minigameImp/exam-minigame";
import { SentenceBuilderMiniGame } from "../models/minigameImp/sentence_builder";
import { ListenSelectMiniGame } from "../models/minigameImp/listen-select-minigame";
import { TrueFalseMiniGame } from "../models/minigameImp/true-false-minigame";
import { TypingChallengeMiniGame } from "../models/minigameImp/typing-challenge-minigame";
import { Activity } from "../models/activity";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { CreateMiniGameDto } from "../dto/request/CreateMiniGameDTO";
import { UpdateMiniGameDto } from "../dto/request/UpdateMiniGameDTO";
import MiniGameType from "../enums/minigameType.enum";
import { minigameRepository } from "../repositories/minigame.repository";
import { activityRepository } from "../repositories/activity.repostitory";


export class MiniGameService {
  // 🔹 Tạo instance MiniGame đúng type
  private static async createMiniGameInstance(dto: CreateMiniGameDto): Promise<MiniGame> {
    const activity = await activityRepository.findOne({ where: { id: dto.activityId } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");

    switch (dto.type) {
      case MiniGameType.MATCH_IMAGE_WORD:
        return new MatchImageWordMiniGame(dto.prompt, dto.resources as any, activity, dto.type);
      case MiniGameType.LESSON:
        return new LessonMiniGame(dto.prompt, dto.resources as any, activity, dto.type);
      case MiniGameType.EXAM:
        return new ExamMiniGame(dto.prompt, dto.resources as any, activity, dto.type);
      case MiniGameType.SENTENCE_BUILDER:
        return new SentenceBuilderMiniGame(dto.prompt, dto.resources as any, activity, dto.type);
      case MiniGameType.LISTEN_SELECT:
        return new ListenSelectMiniGame(dto.prompt, dto.resources as any, activity, dto.type);
      case MiniGameType.TRUE_FALSE:
        return new TrueFalseMiniGame(dto.prompt, dto.resources as any, activity);
      case MiniGameType.TYPING_CHALLENGE:
        return new TypingChallengeMiniGame(dto.prompt, dto.resources as any, activity);
      default:
        throw new ApiError(HttpStatusCode.BadRequest, `Loại minigame không hợp lệ: ${dto.type}`);
    }
  }

  // 🔹 Tạo MiniGame mới
  static async createMiniGame(dto: CreateMiniGameDto): Promise<MiniGame> {
    const miniGame = await this.createMiniGameInstance(dto);
    return minigameRepository.save(miniGame);
  }

  // 🔹 Lấy MiniGame theo id
  static async getById(id: number): Promise<MiniGame> {
    const miniGame = await minigameRepository.findOne({
      where: { id },
      relations: ["activity"],
    });
    if (!miniGame) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy minigame");
    return miniGame;
  }

  // 🔹 Lấy danh sách MiniGame theo Activity
  static async getByActivity(activityId: number): Promise<MiniGame[]> {
    const activity = await activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");

    return minigameRepository.find({
      where: { activity: { id: activityId } },
      order: { createdAt: "ASC" },
      relations: ["activity"],
    });
  }

  // 🔹 Cập nhật MiniGame
  static async updateMiniGame(id: number, dto: UpdateMiniGameDto): Promise<MiniGame> {
    const miniGame = await this.getById(id);

    // Nếu type thay đổi → tạo instance mới cùng id và activity cũ
    if (dto.type && dto.type !== miniGame.constructor.name) {
      const newMiniGame = await this.createMiniGameInstance({
        type: dto.type,
        prompt: dto.prompt ?? miniGame.prompt,
        resources: dto.resources ?? miniGame.resources,
        activityId: miniGame.activity.id,
      });
      newMiniGame.id = miniGame.id; // giữ id cũ
      return minigameRepository.save(newMiniGame);
    }

    // Merge các field khác (prompt, resources)
    minigameRepository.merge(miniGame, {
      prompt: dto.prompt ?? miniGame.prompt,
      resources: dto.resources ?? miniGame.resources,
    });

    return minigameRepository.save(miniGame);
  }

  // 🔹 Xóa MiniGame
  static async deleteMiniGame(id: number): Promise<void> {
    const miniGame = await this.getById(id);
    await minigameRepository.remove(miniGame);
  }
}
