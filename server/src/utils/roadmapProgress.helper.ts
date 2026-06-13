import { UserProgress } from "../models/userProgress";

// Một "day" tối thiểu chỉ cần danh sách activities có id
type DayWithActivities = { activities?: { id: number }[] | null };

export type DayProgressStatus = "completed" | "in_progress" | "not_started";

/**
 * Build map activityId -> UserProgress để tra cứu O(1).
 */
export const buildProgressMap = (progresses: UserProgress[]): Map<number, UserProgress> => {
  const map = new Map<number, UserProgress>();
  for (const progress of progresses) {
    if (progress.activity) {
      map.set(progress.activity.id, progress);
    }
  }
  return map;
};

/**
 * Activity đã từng hoàn thành hay chưa.
 * completedAt != null nghĩa là đã từng hoàn thành (kể cả khi user reset để làm lại):
 * tiêu chí này dùng cho việc MỞ KHÓA; còn isCompleted dùng cho việc HIỂN THỊ completed.
 */
export const wasActivityEverCompleted = (progress?: UserProgress): boolean =>
  Boolean(progress && (progress.isCompleted || progress.completedAt != null));

/**
 * Tính trạng thái tiến độ của 1 day dựa trên progress của các activity.
 */
export const getDayProgressStatus = (
  day: DayWithActivities,
  progressMap: Map<number, UserProgress>
): DayProgressStatus => {
  const activities = day.activities || [];
  if (activities.length === 0) return "not_started";

  let allCompleted = true;
  let anyInProgress = false;

  for (const activity of activities) {
    const progress = progressMap.get(activity.id);
    if (progress) {
      if (!progress.isCompleted) {
        allCompleted = false;
        if (progress.timeSpent && progress.timeSpent > 0) {
          anyInProgress = true;
        }
      }
    } else {
      allCompleted = false;
    }
  }

  if (allCompleted) return "completed";
  if (anyInProgress) return "in_progress";
  return "not_started";
};

/**
 * Day đã từng hoàn thành toàn bộ activity chưa (dùng để mở khóa day kế tiếp).
 * Lưu ý: day không có activity được coi là "đã hoàn thành" để không chặn day sau
 * (giữ nguyên hành vi cũ).
 */
export const isDayEverCompleted = (
  day: DayWithActivities,
  progressMap: Map<number, UserProgress>
): boolean =>
  (day.activities || []).every((activity) => wasActivityEverCompleted(progressMap.get(activity.id)));
