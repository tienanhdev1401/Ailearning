import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { userRepository } from "../repositories/user.repository";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import { roadmapReviewRepository } from "../repositories/roadmapReview.repository";
import { CreateRoadmapReviewDto } from "../dto/request/CreateRoadmapReviewDTO";
import { UpdateRoadmapReviewDto } from "../dto/request/UpdateRoadmapReviewDTO";
import { RoadmapReview } from "../models/roadmapReview";
import USER_ROLE from "../enums/userRole.enum";

export class RoadmapReviewService {
  static async listRoadmapReviews(
    roadmapId: number,
    options: { rating?: number; search?: string; currentUserId?: number } = {}
  ) {
    const roadmap = await roadmapRepository.findOne({ where: { id: roadmapId } });
    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const query = roadmapReviewRepository
      .createQueryBuilder("review")
      .leftJoinAndSelect("review.user", "user")
      .where("review.roadmap = :roadmapId", { roadmapId })
      .orderBy("review.createdAt", "DESC");

    if (options.rating) {
      query.andWhere("review.rating = :rating", { rating: options.rating });
    }

    if (options.search) {
      query.andWhere("review.comment LIKE :search", { search: `%${options.search}%` });
    }

    const reviews = await query.getMany();

    let orderedReviews = reviews;
    if (options.currentUserId) {
      const userIndex = reviews.findIndex((item) => item.user?.id === options.currentUserId);
      if (userIndex > -1) {
        const reviewsClone = [...reviews];
        const [userReview] = reviewsClone.splice(userIndex, 1);
        orderedReviews = [userReview, ...reviewsClone];
      }
    }

    const statsRaw = await roadmapReviewRepository
      .createQueryBuilder("review")
      .select("review.rating", "rating")
      .addSelect("COUNT(review.id)", "count")
      .where("review.roadmap = :roadmapId", { roadmapId })
      .groupBy("review.rating")
      .getRawMany();

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    let total = 0;
    let scoreSum = 0;

    statsRaw.forEach((item) => {
      const ratingValue = Number(item.rating);
      const countValue = Number(item.count);
      if (breakdown[ratingValue] !== undefined) {
        breakdown[ratingValue] = countValue;
        total += countValue;
        scoreSum += ratingValue * countValue;
      }
    });

    const average = total ? Math.round((scoreSum / total) * 10) / 10 : 0;

    const response = orderedReviews.map((review) => this.toResponse(review, options.currentUserId));

    return {
      summary: {
        total,
        average,
        breakdown,
      },
      reviews: response,
    };
  }

  static async createRoadmapReview(userId: number, roadmapId: number, payload: CreateRoadmapReviewDto) {
    const [user, roadmap] = await Promise.all([
      userRepository.findOne({ where: { id: userId } }),
      roadmapRepository.findOne({ where: { id: roadmapId } }),
    ]);

    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const enrollment = await roadmapEnrollementRepository.findOne({
      where: {
        user: { id: userId },
        roadmap: { id: roadmapId },
      },
    });

    if (!enrollment) {
      throw new ApiError(HttpStatusCode.Forbidden, "Bạn cần tham gia lộ trình trước khi đánh giá");
    }

    const trimmedComment = payload.comment.trim();
    if (!trimmedComment) {
      throw new ApiError(HttpStatusCode.BadRequest, "Nội dung đánh giá không được để trống");
    }

    let review = await roadmapReviewRepository.findOne({
      where: { roadmap: { id: roadmapId }, user: { id: userId } },
      relations: ["user", "roadmap"],
    });

    if (review) {
      review.rating = payload.rating;
      review.comment = trimmedComment;
    } else {
      review = roadmapReviewRepository.create({
        roadmap,
        user,
        rating: payload.rating,
        comment: trimmedComment,
      });
    }

    const savedReview = await roadmapReviewRepository.save(review);
    return this.toResponse(savedReview, userId);
  }

  static async updateRoadmapReview(
    requesterId: number,
    _requesterRole: USER_ROLE,
    reviewId: number,
    payload: UpdateRoadmapReviewDto
  ) {
    const review = await roadmapReviewRepository.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });

    if (!review) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy đánh giá");
    }

    const isOwner = review.user.id === requesterId;

    if (!isOwner) {
      throw new ApiError(HttpStatusCode.Forbidden, "Chỉ chủ sở hữu mới có thể chỉnh sửa đánh giá này");
    }

    if (typeof payload.rating === "number") {
      review.rating = payload.rating;
    }

    if (typeof payload.comment === "string") {
      const trimmedComment = payload.comment.trim();
      if (!trimmedComment) {
        throw new ApiError(HttpStatusCode.BadRequest, "Nội dung đánh giá không được để trống");
      }
      review.comment = trimmedComment;
    }

    const saved = await roadmapReviewRepository.save(review);
    return this.toResponse(saved, requesterId);
  }

  static async deleteRoadmapReview(requesterId: number, _requesterRole: USER_ROLE, reviewId: number) {
    const review = await roadmapReviewRepository.findOne({
      where: { id: reviewId },
      relations: ["user"],
    });

    if (!review) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy đánh giá");
    }

    const isOwner = review.user.id === requesterId;

    if (!isOwner) {
      throw new ApiError(HttpStatusCode.Forbidden, "Chỉ chủ sở hữu mới có thể xoá đánh giá này");
    }

    await roadmapReviewRepository.remove(review);
    return true;
  }

  private static toResponse(review: RoadmapReview, currentUserId?: number) {
    if (!review) return null;

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      isOwner: currentUserId ? review.user?.id === currentUserId : false,
      user: review.user
        ? {
            id: review.user.id,
            name: review.user.name,
            avatarUrl: review.user.avatarUrl,
          }
        : null,
    };
  }
}
