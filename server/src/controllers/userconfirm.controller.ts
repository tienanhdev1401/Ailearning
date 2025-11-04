import { Request, Response, NextFunction } from "express";
import { UserConfirmService } from "../services/userconfirm.service";
import { HttpStatusCode } from "axios";

export class UserConfirmController {
  static async create(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const confirmedData = req.body;

      const record = await UserConfirmService.create(userId, confirmedData);
      res.status(HttpStatusCode.Created).json(record);
    } catch (error) {
      next(error);
    }
  }

  static async checkFirstConfirm(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const completed = await UserConfirmService.checkFirstConfirm(userId);
      res.status(HttpStatusCode.Ok).json({ completed });
    } catch (error) {
      next(error);
    }
  }

  static async getConfirmData(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const confirmedData = await UserConfirmService.getConfirmData(userId);
      res.status(HttpStatusCode.Ok).json({ confirmedData });
    } catch (error) {
      next(error);
    }
  }
}
