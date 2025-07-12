const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const verifyTokenAndRole = require("../middlewares/auth.middleware");

// Đăng nhập
router.post("/login", AuthController.login);

// Refresh token
router.post("/refresh", AuthController.refreshToken);

// Đăng xuất
router.post("/logout", AuthController.logout);

// Lấy thông tin người dùng đang đăng nhập
router.get("/me", verifyTokenAndRole(), AuthController.getMe);

module.exports = router;