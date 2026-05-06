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

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await dashboardService.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  }

  static async getSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await dashboardService.getAllSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      next(error);
    }
  }

  static async getTopCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const topCustomers = await dashboardService.getTopCustomers();
      res.json(topCustomers);
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;