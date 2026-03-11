import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service";

const subscriptionService = new SubscriptionService();

export const getMySubscriptions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const subscriptions = await subscriptionService.getUserSubscriptions(user.id);
    res.json(subscriptions);
  } catch (error: any) {
    console.error("Get My Subscriptions Error:", error);
    res.status(500).json({ message: error.message || "Failed to fetch subscriptions" });
  }
};
