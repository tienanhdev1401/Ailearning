import { Request, Response, NextFunction } from "express";
import { DailyChallengeService } from "../services/dailyChallenge.service";

export class DailyChallengeController {
  // 🔹 Lấy trạng thái thử thách
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { roadmapId } = req.params;

      const status = await DailyChallengeService.getChallengeStatus(userId, Number(roadmapId));
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Tạo thử thách mới
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { roadmapId } = req.params;

      const challenge = await DailyChallengeService.generateChallenge(userId, Number(roadmapId));
      res.status(200).json(challenge);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Nộp kết quả thử thách
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { roadmapId } = req.params;

      const result = await DailyChallengeService.submitChallenge(userId, Number(roadmapId));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default DailyChallengeController;
