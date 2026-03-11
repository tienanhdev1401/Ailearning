import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { AppDataSource } from "../config/database";
import { SubscriptionPackage } from "../models/subscriptionPackage";
import { User } from "../models/user";

const paymentService = new PaymentService();

export const createPaymentUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as User;
    if (!user || !user.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { packageId } = req.params;
    if (!packageId) {
      res.status(400).json({ message: "packageId is required" });
      return;
    }

    const packageIdNum = Number(packageId);
    if (isNaN(packageIdNum)) {
      res.status(400).json({ message: "Invalid packageId" });
      return;
    }

    // Cửa ngõ Backend: VNPAY sẽ trả trình duyệt về đây trước
    const backendReturnUrl = `http://localhost:5000/api/payments/vnpay-ipn`;
    const ipnUrl = `http://localhost:5000/api/payments/vnpay-ipn`;
    const ipAddr = req.ip || "127.0.0.1";

    const url = await paymentService.createPaymentUrl(user.id, packageIdNum, backendReturnUrl, ipnUrl, ipAddr);
    res.json({ url });
  } catch (error: any) {
    console.error("Payment Creation Error:", error);
    res.status(400).json({ message: error.message || "Failed to create payment URL" });
  }
};

export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("--- VNPAY IPN RECEIVED ---");
    console.log("Query:", req.query);
    const query = req.query as Record<string, string>;
    await paymentService.handleVnpayIpn(query);

    // Sau khi xử lý DB xong, tự động Redirect trình duyệt về Frontend (Port 3000)
    // Giữ nguyên các tham số vnp_... để Frontend hiển thị thông tin
    const frontendUrl = process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment-success";
    const queryString = new URLSearchParams(query).toString();

    res.redirect(`${frontendUrl}?${queryString}`);
  } catch (error: any) {
    console.error("IPN Error:", error);
    // Nếu lỗi, vẫn redirect về frontend để báo lỗi cho user
    const frontendUrl = process.env.VNPAY_RETURN_URL || "http://localhost:3000/payment-success";
    res.redirect(`${frontendUrl}?vnp_ResponseCode=99`);
  }
};

export const getPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const packageRepo = AppDataSource.getRepository(SubscriptionPackage);
    const packages = await packageRepo.find();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch packages" });
  }
}
