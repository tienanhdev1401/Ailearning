import express from "express";
import AuthController from "../controllers/auth.controller.js";
import verifyTokenAndRole from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import loginValidation from "../validations/loginValidation.js";
import registerValidation from "../validations/registerValidation.js";

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
 *             $ref: '#/components/schemas/Login'
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
 *             $ref: '#/components/schemas/Register'
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
router.post("/login",validateRequest(loginValidation) ,AuthController.login);

// Đăng ký
router.post("/register",validateRequest(registerValidation) ,AuthController.register);

// Refresh token
router.post("/refresh", AuthController.refreshToken);

// Đăng xuất
router.post("/logout", AuthController.logout);

// Lấy thông tin người dùng đang đăng nhập
router.get("/me", verifyTokenAndRole(), AuthController.getMe);

export default router;