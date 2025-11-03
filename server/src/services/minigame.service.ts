import { AppDataSource } from "../config/database";
import { MiniGame } from "../models/minigame";
import { MatchImageWordMiniGame } from "../models/minigameImp/match-image-word-minigame";
import { Activity } from "../models/activity";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { CreateMiniGameDto } from "../dto/request/CreateMiniGameDTO";
import EType from "../enums/minigameType.enum";
import { minigameRepository } from "../repositories/minigame.repository";
import { activityRepository } from "../repositories/activity.repostitory";
import { UpdateMiniGameDto } from "../dto/request/UpdateMiniGameDTO";

export class MiniGameService {

  private static async createMiniGameInstance(dto: CreateMiniGameDto): Promise<MiniGame> {
    const activity = await activityRepository.findOne({ where: { id: dto.activityId } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");

    switch (dto.type) {
      case EType.MATCH_IMAGE_WORD:
        return new MatchImageWordMiniGame(dto.prompt, dto.resources as any, activity);

      default:
        return new MiniGame(dto.prompt, dto.type, dto.resources, activity);
    }
  }

  static async createMiniGame(dto: CreateMiniGameDto): Promise<MiniGame> {
    const miniGame = await this.createMiniGameInstance(dto);
    return minigameRepository.save(miniGame);
  }

  static async getById(id: number): Promise<MiniGame> {
    const miniGame = await minigameRepository.findOne({
      where: { id },
      relations: ["activity"],
    });
    if (!miniGame) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy minigame");
    return miniGame;
  }

  static async getByActivity(activityId: number): Promise<MiniGame[]> {
    const activity = await activityRepository.findOne({ where: { id: activityId } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");

    return minigameRepository.find({
      where: { activity: { id: activityId } },
      order: { createdAt: "ASC" },
      relations: ["activity"],
    });
  }

  // UPDATE
  static async updateMiniGame(id: number, dto: UpdateMiniGameDto): Promise<MiniGame> {
    const miniGame = await this.getById(id);

    // Nếu type thay đổi, tạo instance mới cùng activity cũ
    if (dto.type && dto.type !== miniGame.type) {
      const newMiniGame = await this.createMiniGameInstance({
        type: dto.type,
        prompt: dto.prompt ?? miniGame.prompt,
        resources: dto.resources ?? miniGame.resources,
        activityId: miniGame.activity.id,
      });
      newMiniGame.id = miniGame.id; 
      return minigameRepository.save(newMiniGame);
    }

    // Merge các field khác
    minigameRepository.merge(miniGame, dto);

    return minigameRepository.save(miniGame);
  }

  // DELETE
  static async deleteMiniGame(id: number): Promise<void> {
    const miniGame = await this.getById(id);
    await minigameRepository.remove(miniGame);
  }
}
