import { Request, Response, NextFunction } from "express";
import { ActivityService } from "../services/activity.service";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";
import { plainToInstance } from "class-transformer";
import { HttpStatusCode } from "axios";
import { UpdateActivityDto } from "../dto/request/UpdateActivityDTO";
import { UpdateManyActivitiesDto } from "../dto/request/UpdateManyActivitiesDTO";


export class ActivityController {
  static async addActivityToDay(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = plainToInstance(CreateActivityDto, req.body);
      const newActivity = await ActivityService.createActivity(dto);
      res.status(HttpStatusCode.Created).json(newActivity);
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const activity = await ActivityService.getById(id);
      res.status(HttpStatusCode.Ok).json(activity);
    } catch (err) {
      next(err);
    }
  }

  static async getAllActivityByDayId(req: Request, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.dayId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const list = await ActivityService.getAllActivityByDayId(dayId, page, limit);
      res.status(HttpStatusCode.Ok).json(list);
    } catch (err) {
      next(err);
    }
  }

  static async updateActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updateActivity = plainToInstance(UpdateActivityDto, req.body);
      const updated = await ActivityService.updateActivity(id, updateActivity);
      res.status(HttpStatusCode.Ok).json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await ActivityService.deleteActivity(id);
      res.status(HttpStatusCode.Ok).json({ message: "Xóa activity thành công" });
    } catch (err) {
      next(err);
    }
  }
  static async updateManyActivities(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = plainToInstance(UpdateManyActivitiesDto, req.body);
      const result = await ActivityService.updateManyActivities(dto);
      res.status(HttpStatusCode.Ok).json(result);
    }
    catch (err) {
      next(err);
    }
  }
}

export default ActivityController;