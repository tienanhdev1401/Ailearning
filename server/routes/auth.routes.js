import express from "express";
import AuthController from "../controllers/auth.controller.js";
import verifyTokenAndRole from "../middlewares/auth.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import loginValidation from "../validations/loginValidation.js";
import registerValidation from "../validations/registerValidation.js";

const router = express.Router();
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