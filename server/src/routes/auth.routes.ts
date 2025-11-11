import express from "express";
import AuthController from "../controllers/auth.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import validateDto from "../middlewares/validateRequest.middleware";
import { RegisterDto } from "../dto/request/RegisterDTO";
import { LoginDto } from "../dto/request/LoginDTO";
import { UpdateProfileDto } from "../dto/request/UpdateProfileDTO";
import { loginLimiter, otpLimiter } from "../middlewares/ratelimit.middleware";

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Quản lý xác thực
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDto'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới Access Token từ Refresh Token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Trả về accessToken mới
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token mới
 *       401:
 *         description: Không có refresh token hoặc refresh token không hợp lệ
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất người dùng
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout thành công
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Không có hoặc access token không hợp lệ
 */


// Đăng nhập
router.post("/login",loginLimiter,validateDto(LoginDto) ,AuthController.login);

// Đăng ký
router.post("/register",validateDto(RegisterDto) ,AuthController.register);

// Refresh token
router.post("/refresh", AuthController.refreshToken);

// Đăng xuất
router.post("/logout", AuthController.logout);

// Lấy thông tin người dùng đang đăng nhập
router.get("/me", verifyTokenAndRole(), AuthController.getMe);

// Cập nhật thông tin người dùng đang đăng nhập
router.patch("/me", verifyTokenAndRole(), validateDto(UpdateProfileDto), AuthController.updateMe);

// Gửi mã xác thực (OTP)
router.post("/send-verification-code",otpLimiter, AuthController.sendVerificationCode);

// Xác minh OTP
router.post("/verify-otp", AuthController.verifyOtp);

// Đặt lại mật khẩu
router.post("/reset-password", AuthController.resetPassword);

export default router;