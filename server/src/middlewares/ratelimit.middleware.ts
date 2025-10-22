// ratelimit.middleware.js
import rateLimit from "express-rate-limit";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

// Rate limit chung cho toàn bộ app
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút detect spam
  max: 100, // mỗi IP tối đa 100 request
  message: "Bạn đã gửi quá nhiều request, vui lòng thử lại sau 15 phút",
});

// Rate limit riêng cho /login
const loginLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 giây detect spam
  max: 5,
  message: "Bạn đã thử đăng nhập quá nhiều lần, hãy thử lại sau 30 giây",
});


export { limiter, loginLimiter };
