import ApiError from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { activityRepository } from "../repositories/activity.repostitory";
import { dayRepository } from "../repositories/day.repository";
import { userProgressRepository } from "../repositories/userProgress.repository";
import { HttpStatusCode } from "axios";

export class UserProgressService {

  // Cập nhật tiến trình học activity
  static async updateProgress(
    userId: number,
    activityId: number,
    timeSpent: number,
    isCompleted: boolean
  ) {
    // 1️⃣ Validate user & activity
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) throw new ApiError(HttpStatusCode.NotFound, "User không tồn tại");

    const activity = await activityRepository.findOne({
      where: { id: activityId },
      relations: ["day", "day.roadmap", "day.activities"]
    });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Activity không tồn tại");

    const day = activity.day;

    // 2️⃣ Kiểm tra day có được học hay không
    if (day.dayNumber > 1) {
      // Lấy day trước
      const previousDay = await dayRepository.findOne({
        where: { roadmap: { id: day.roadmap.id }, dayNumber: day.dayNumber - 1 },
        relations: ["activities"]
      });

      // Lấy tiến trình user cho day trước
      const prevDayProgresses = await userProgressRepository.find({
        where: { user: { id: userId }, activity: { day: { id: previousDay?.id } } },
        relations: ["activity"]
      });

      const prevDayCompleted = previousDay?.activities.every(a =>
        prevDayProgresses.some(p => p.activity.id === a.id && p.isCompleted)
      );

      if (!prevDayCompleted) {
        throw new ApiError(HttpStatusCode.BadRequest, "Phải hoàn thành day trước mới được học day này");
      }
    }

    // 3️⃣ Lấy hoặc tạo UserProgress
    let progress = await userProgressRepository.findOne({
      where: { user: { id: userId }, activity: { id: activityId } },
    });

    const normalizedTimeSpent = Number.isFinite(timeSpent) ? Math.max(0, timeSpent) : 0;

    if (!progress) {
      progress = userProgressRepository.create({
        user,
        activity,
        timeSpent: normalizedTimeSpent,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      });
    } else {
      // Cộng dồn thời gian thay vì ghi đè để không mất dữ liệu của những lần học trước
      progress.timeSpent = (progress.timeSpent || 0) + normalizedTimeSpent;

      // Nếu user đã hoàn thành activity thì không cho phép revert về trạng thái chưa hoàn thành
      if (isCompleted && !progress.isCompleted) {
        progress.isCompleted = true;
      } else if (!progress.isCompleted) {
        progress.isCompleted = false;
      }

      if (isCompleted && !progress.completedAt) {
        progress.completedAt = new Date();
      }
    }

    await userProgressRepository.save(progress);
    return progress;
  }

  // Lấy tất cả progress của user trong 1 day (để frontend render status)
  static async getProgressByDay(userId: number, dayId: number) {
    const progresses = await userProgressRepository.find({
      where: { user: { id: userId }, activity: { day: { id: dayId } } },
      relations: ["activity"]
    });
    return progresses;
  }
}
