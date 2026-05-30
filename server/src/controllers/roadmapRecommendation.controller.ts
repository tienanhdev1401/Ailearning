import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { RoadmapRecommendationService } from "../services/roadmapRecommendation.service";

export class RoadmapRecommendationController {
  /**
   * GET /api/roadmap-recommendation
   * Trả về lộ trình được AI đề xuất dựa trên dữ liệu multicheck của user.
   */
  static async getRecommendation(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res
          .status(HttpStatusCode.Unauthorized)
          .json({ message: "Không xác định được người dùng." });
      }

      const recommendation =
        await RoadmapRecommendationService.getRecommendation(userId);

      res.status(HttpStatusCode.Ok).json(recommendation);
    } catch (error) {
      next(error);
    }
  }
}
