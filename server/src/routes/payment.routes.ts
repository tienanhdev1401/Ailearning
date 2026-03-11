import express from "express";
import { createPaymentUrl, vnpayIpn, getPackages } from "../controllers/payment.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Payment
 *     description: Quản lý thanh toán và các gói đăng ký
 */

/**
 * @swagger
 * /api/payments/packages:
 *   get:
 *     summary: Lấy danh sách các gói có thể mua
 *     tags: [Payment]
 */
router.get("/packages", getPackages);

/**
 * @swagger
 * /api/payments/create-payment:
 *   post:
 *     summary: Tạo URL thanh toán VNPAY
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/create/:packageId",
  verifyTokenAndRole([USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  createPaymentUrl
);

/**
 * @swagger
 * /api/payments/vnpay-ipn:
 *   get:
 *     summary: Webhook IPN xử lý kết quả thanh toán từ VNPAY
 *     tags: [Payment]
 */
router.get("/vnpay-ipn", vnpayIpn);

export default router;
