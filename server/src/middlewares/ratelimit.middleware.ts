// ratelimit.middleware.js
import rateLimit from "express-rate-limit";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

// Rate limit chung cho toàn bộ app
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút detect spam
  max: 1000, // mỗi IP tối đa 1000 request
  message: "Bạn đã gửi quá nhiều request, vui lòng thử lại sau 15 phút",
});

// Rate limit riêng cho /login
const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 giây detect spam
  max: 5,
  message: "Bạn đã thử đăng nhập quá nhiều lần, hãy thử lại sau 30 giây",
});

// Rate limit riêng cho /send-otp
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 3, // Mỗi IP chỉ gửi tối đa 3 OTP / phút
  message: "Bạn đã gửi quá nhiều mã OTP, vui lòng thử lại sau 1 phút",
  standardHeaders: true, // Gửi thông tin rate limit trong header
  legacyHeaders: false,  // Tắt header cũ
});


export { limiter, loginLimiter, otpLimiter };
