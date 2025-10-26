import { Request, Response, NextFunction } from "express";
import { ActivityService } from "../services/activity.service";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";

export class ActivityController {
  static async addActivityToDay(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateActivityDto.fromPlain(req.body);
      const newActivity = await ActivityService.createActivity(dto);
      res.status(201).json(newActivity);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const activity = await ActivityService.getById(id);
      res.status(200).json(activity);
    } catch (err) {
      next(err);
    }
  }

  static async getAllActivityByDayId(req: Request, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.dayId);
      const list = await ActivityService.getAllActivityByDayId(dayId);
      res.status(200).json(list);
    } catch (err) {
      next(err);
    }
  }

  static async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updated = await ActivityService.updateActivity(id, req.body);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await ActivityService.deleteActivity(id);
      res.status(200).json({ message: "Xóa activity thành công" });
    } catch (err) {
      next(err);
    }
  }
}
