import express from "express";
import AuthController from "../controllers/auth.controller.js";
import verifyTokenAndRole from "../middlewares/auth.middleware.js";

const router = express.Router();
// Đăng nhập
router.post("/login", AuthController.login);

// Refresh token
router.post("/refresh", AuthController.refreshToken);

// Đăng xuất
router.post("/logout", AuthController.logout);

// Lấy thông tin người dùng đang đăng nhập
router.get("/me", verifyTokenAndRole(), AuthController.getMe);

export default router;