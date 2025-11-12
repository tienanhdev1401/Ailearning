import { Request, Response } from "express";
import { UserProgressService } from "../services/userProgess.service";

export class UserProgressController {
  // Cập nhật tiến trình học của người dùng đối với 1 activity 
  static async updateProgress(req: Request, res: Response) {
    try {
      const { userId, activityId } = req.params;
      const { timeSpent, isCompleted } = req.body;

      const progress = await UserProgressService.updateProgress(
        Number(userId),
        Number(activityId),
        Number(timeSpent),
        Boolean(isCompleted)
      );

      // Nếu đang làm thì iscompleted: false, kèm timespent
      // Nếu hoàn thành thì iscompleted: true, kèm timespent, compltedAt
      res.json(progress);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  static async getProgressByDay(req: Request, res: Response) {
    try {
      const { userId, dayId } = req.params;
      const progresses = await UserProgressService.getProgressByDay(
        Number(userId),
        Number(dayId) 
      );
      res.json(progresses);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }
}
