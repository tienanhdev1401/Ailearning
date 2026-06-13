import express from "express";
import passport from "passport";
import AuthService from "../services/auth.service";
import { User } from "../models/user";

const router = express.Router();

const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const cookieSecure = (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true";
const cookieSameSite = (process.env.COOKIE_SAMESITE as "strict" | "lax" | "none") || "strict";

// Route: Bắt đầu xác thực với Google
router.get("/google", (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"], // Không truyền response_type vì không thuộc AuthenticateOptionsGoogle
  })(req, res, next);
});

// Route: Google callback sau khi người dùng xác thực
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  (req, res) => {

    const accessToken = AuthService.generateAccessToken(req.user as User);
    const refreshToken = AuthService.generateRefreshToken(req.user as User);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
    });

    // Tuỳ: Redirect về frontend hoặc trả JSON
    // res.json({ accessToken });
    res.redirect(`${frontendUrl}/login?accessToken=${accessToken}`); // nếu dùng frontend
  }
);

router.get("/login-failed", (req, res) => {
  res.status(401).json({ message: "Đăng nhập bằng Google thất bại." });
});

export default router;
