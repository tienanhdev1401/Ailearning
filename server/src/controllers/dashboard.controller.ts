import { Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getOverview();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;