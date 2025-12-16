import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { userRepository } from "../repositories/user.repository";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import ENROLLMENT_STATUS from "../enums/enrollmentStatus.enum";
import { activityRepository } from "../repositories/activity.repostitory";
import { userProgressRepository } from "../repositories/userProgress.repository";
import { dayRepository } from "../repositories/day.repository";
import { UserProgress } from "../models/userProgress";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";

export class RoadmapEnrollmentService {
  private static async resetProgressForRoadmap(userId: number, roadmapId: number) {
    const activities = await activityRepository.find({
      where: { day: { roadmap: { id: roadmapId } } },
      select: ["id"],
      relations: ["day", "day.roadmap"],
    });

    const activityIds = activities.map((activity) => activity.id);
    if (!activityIds.length) return;

    await userProgressRepository
      .createQueryBuilder()
      .delete()
      .from(UserProgress)
      .where("userId = :userId", { userId })
      .andWhere("activityId IN (:...activityIds)", { activityIds })
      .execute();
  }

  private static async buildProgressSummary(userId: number, roadmapId: number) {
    const days = await dayRepository.find({
      where: { roadmap: { id: roadmapId } },
      relations: ["activities"],
      order: { dayNumber: "ASC" },
    });

    if (!days.length) {
      return {
        totalDays: 0,
        lastCompletedDay: 0,
        lastTouchedDay: 0,
        resumeDay: 1,
        hasProgress: false,
      };
    }

    const progresses = await userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ["activity", "activity.day", "activity.day.roadmap"],
    });

    const progressMap = new Map<number, UserProgress>();
    progresses.forEach((progress) => {
      if (progress.activity?.day?.roadmap?.id === roadmapId) {
        progressMap.set(progress.activity.id, progress);
      }
    });

    let lastCompletedDay = 0;
    let lastTouchedDay = 0;

    days.forEach((day) => {
      const activities = day.activities || [];
      const anyTouched = activities.some((activity) => progressMap.has(activity.id));
      const allCompleted =
        activities.length > 0 && activities.every((activity) => progressMap.get(activity.id)?.isCompleted);

      if (anyTouched) lastTouchedDay = day.dayNumber;
      if (allCompleted) lastCompletedDay = day.dayNumber;
    });

    const hasProgress = lastCompletedDay > 0 || lastTouchedDay > 0;
    const resumeDay = Math.min(
      days.length,
      hasProgress ? Math.max(lastCompletedDay + 1, lastTouchedDay || 1) : 1
    );

    return {
      totalDays: days.length,
      lastCompletedDay,
      lastTouchedDay,
      resumeDay,
      hasProgress,
    };
  }

  // Đăng ký người dùng vào 1 roadmap và đảm bảo chỉ một roadmap active
  static async enrollUserToRoadmap(userId: number, roadmapId: number): Promise<RoadmapEnrollment> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    const roadmap = await roadmapRepository.findOne({ where: { id: roadmapId } });
    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const existingEnrollment = await roadmapEnrollementRepository.findOne({
      where: { user: { id: userId }, roadmap: { id: roadmapId } },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "active") {
        throw new ApiError(HttpStatusCode.BadRequest, "Người dùng đã tham gia đăng ký roadmap này rồi");
      }
      existingEnrollment.status = "active";
      existingEnrollment.started_at = new Date();
      await roadmapEnrollementRepository.save(existingEnrollment);
      const otherEnrollments = await roadmapEnrollementRepository.find({
        where: { user: { id: userId }, status: "active" },
        relations: ["roadmap"],
      });
      const updates = otherEnrollments
        .filter((enrollment) => enrollment.roadmap.id !== roadmapId)
        .map((enrollment) => {
          enrollment.status = "paused";
          return enrollment;
        });
      if (updates.length) {
        await roadmapEnrollementRepository.save(updates);
      }
      return existingEnrollment;
    }

    const enrollment = roadmapEnrollementRepository.create({
      user,
      roadmap,
      status: "active",
      started_at: new Date(),
    });

    const saved = await roadmapEnrollementRepository.save(enrollment);

    const otherEnrollments = await roadmapEnrollementRepository.find({
      where: { user: { id: userId }, status: "active" },
      relations: ["roadmap"],
    });

    const updates = otherEnrollments
      .filter((enrollment) => enrollment.roadmap.id !== roadmapId)
      .map((enrollment) => {
        enrollment.status = "paused";
        return enrollment;
      });

    if (updates.length) {
      await roadmapEnrollementRepository.save(updates);
    }

    return saved;
  }

  static async setActiveRoadmap(
    userId: number,
    roadmapId: number,
    options: { restart?: boolean } = {}
  ) {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    const roadmap = await roadmapRepository.findOne({ where: { id: roadmapId } });
    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const enrollments = await roadmapEnrollementRepository.find({
      where: { user: { id: userId } },
      relations: ["roadmap"],
      order: { started_at: "DESC" },
    });

    let target = enrollments.find((enrollment) => enrollment.roadmap.id === roadmapId);

    if (!target) {
      target = roadmapEnrollementRepository.create({
        user,
        roadmap,
        status: "active",
        started_at: new Date(),
      });
      enrollments.push(target);
    } else {
      target.status = "active";
      target.started_at = new Date();
    }

    const updates: RoadmapEnrollment[] = [];

    enrollments.forEach((enrollment) => {
      if (enrollment.roadmap.id === roadmapId) {
        updates.push(target);
      } else if (enrollment.status === "active") {
        enrollment.status = "paused";
        updates.push(enrollment);
      }
    });

    if (options.restart) {
      await this.resetProgressForRoadmap(userId, roadmapId);
    }

    await roadmapEnrollementRepository.save(updates);

    const progressSummary = await this.buildProgressSummary(userId, roadmapId);

    return {
      enrolled: true,
      status: target.status,
      roadmap_enrollement: target,
      progressSummary,
    };
  }

  static async getActiveEnrollment(userId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({
      where: { user: { id: userId }, status: "active" },
      relations: ["roadmap"],
      order: { started_at: "DESC" },
    });

    if (!enrollment) {
      return { hasActive: false, enrollment: null, progressSummary: null };
    }

    const progressSummary = await this.buildProgressSummary(userId, enrollment.roadmap.id);

    return { hasActive: true, enrollment, progressSummary };
  }

  // Lấy danh sách roadmap mà 1 user đã tham gia
  static async getEnrollmentsByUser(userId: number): Promise<RoadmapEnrollment[]> {
    return await roadmapEnrollementRepository.find({
      where: { user: { id: userId } },
      relations: ["roadmap"],
      order: { started_at: "DESC" },
    });
  }

  // Cập nhật trạng thái tham gia (pause, resume, complete, drop)
  static async updateStatus(enrollmentId: number, status: ENROLLMENT_STATUS) {
    if (!Object.values(ENROLLMENT_STATUS).includes(status))
      throw new ApiError(HttpStatusCode.BadRequest, "Trạng thái không hợp lệ");
    
    const enrollment = await roadmapEnrollementRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy bản ghi đăng ký");
    }

    enrollment.status = status;
    return await roadmapEnrollementRepository.save(enrollment);
  }

  // Xóa việc tham gia roadmap
  static async removeEnrollment(enrollmentId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy bản ghi đăng ký");
    }

    await roadmapEnrollementRepository.remove(enrollment);
    return { message: "Xóa đăng ký thành công" };
  }

  static async checkEnroll(userId: number, roadmapId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({
      where: {
        user: { id: userId },      
        roadmap: { id: roadmapId } 
      },
      relations: ["roadmap"], 
    });

    if (!enrollment) {
      return { enrolled: false, hasEnrollment: false, status: null, progressSummary: null };
    }

    const progressSummary = await this.buildProgressSummary(userId, roadmapId);

    return {
      enrolled: enrollment.status === "active",
      hasEnrollment: true,
      status: enrollment.status,
      roadmap_enrollement: enrollment,
      progressSummary,
    };
  }
}
