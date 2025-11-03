// controllers/miniGame.controller.ts
import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { plainToInstance } from "class-transformer";
import { MiniGameService } from "../services/minigame.service";
import { CreateMiniGameDto } from "../dto/request/CreateMiniGameDTO";
import { UpdateMiniGameDto } from "../dto/request/UpdateMiniGameDTO";

class MiniGameController {
  static async createMiniGame(req: Request, res: Response, next: NextFunction) {
    try {
      const createDto = plainToInstance(CreateMiniGameDto, req.body);
      const newMiniGame = await MiniGameService.createMiniGame(createDto);
      res.status(HttpStatusCode.Created).json(newMiniGame);
    } catch (error) {
      next(error);
    }
  }

  static async getMiniGameById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const miniGame = await MiniGameService.getById(id);
      res.status(HttpStatusCode.Ok).json(miniGame);
    } catch (error) {
      next(error);
    }
  }

  static async getMiniGamesByActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const activityId = Number(req.params.activityId);
      const miniGames = await MiniGameService.getByActivity(activityId);
      res.status(HttpStatusCode.Ok).json(miniGames);
    } catch (error) {
      next(error);
    }
  }

  static async updateMiniGame(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updateDto = plainToInstance(UpdateMiniGameDto, req.body);
      const updatedMiniGame = await MiniGameService.updateMiniGame(id, updateDto);
      res.status(HttpStatusCode.Ok).json(updatedMiniGame);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Xóa minigame
  static async deleteMiniGame(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await MiniGameService.deleteMiniGame(id);
      res.status(HttpStatusCode.Ok).json({ message: "Xóa MiniGame thành công" });
    } catch (error) {
      next(error);
    }
  }
}

export default MiniGameController;
