import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { RoadmapReviewService } from "../services/roadmapReview.service";
import USER_ROLE from "../enums/userRole.enum";
import jwt from "jsonwebtoken";

type AuthenticatedUser = {
  id: number;
  role: USER_ROLE;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

const getAuthenticatedUser = (req: Request): AuthenticatedUser | undefined => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user) {
    return authReq.user;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    return undefined;
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET as string) as AuthenticatedUser;
    return decoded;
  } catch (error) {
    return undefined;
  }
};

export class RoadmapReviewController {
  static async getRoadmapReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const roadmapId = Number(req.params.roadmapId);
      if (Number.isNaN(roadmapId)) {
        return res.status(HttpStatusCode.BadRequest).json({ message: "roadmapId không hợp lệ" });
      }

      const rating = req.query.rating ? Number(req.query.rating) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const data = await RoadmapReviewService.listRoadmapReviews(roadmapId, {
        rating: rating && !Number.isNaN(rating) ? rating : undefined,
        search,
        currentUserId: getAuthenticatedUser(req)?.id,
      });

      return res.status(HttpStatusCode.Ok).json(data);
    } catch (error) {
      next(error);
    }
  }

  static async createRoadmapReview(req: Request, res: Response, next: NextFunction) {
    try {
      const roadmapId = Number(req.params.roadmapId);
      if (Number.isNaN(roadmapId)) {
        return res.status(HttpStatusCode.BadRequest).json({ message: "roadmapId không hợp lệ" });
      }

      const user = getAuthenticatedUser(req);
      const userId = user?.id;
      if (!userId) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: "Không xác thực được người dùng" });
      }

      const review = await RoadmapReviewService.createRoadmapReview(userId, roadmapId, req.body);
      return res.status(HttpStatusCode.Created).json(review);
    } catch (error) {
      next(error);
    }
  }

  static async updateRoadmapReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.reviewId);
      if (Number.isNaN(reviewId)) {
        return res.status(HttpStatusCode.BadRequest).json({ message: "reviewId không hợp lệ" });
      }

      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: "Không xác thực được người dùng" });
      }

      const updated = await RoadmapReviewService.updateRoadmapReview(
        user.id,
        user.role,
        reviewId,
        req.body
      );
      return res.status(HttpStatusCode.Ok).json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteRoadmapReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = Number(req.params.reviewId);
      if (Number.isNaN(reviewId)) {
        return res.status(HttpStatusCode.BadRequest).json({ message: "reviewId không hợp lệ" });
      }

      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(HttpStatusCode.Unauthorized).json({ message: "Không xác thực được người dùng" });
      }

      await RoadmapReviewService.deleteRoadmapReview(user.id, user.role, reviewId);
      return res.status(HttpStatusCode.Ok).json({ message: "Đã xoá đánh giá" });
    } catch (error) {
      next(error);
    }
  }

}

export default RoadmapReviewController;
