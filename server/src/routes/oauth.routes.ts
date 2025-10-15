import express from "express";
import passport from "passport";
import AuthService from "../services/auth.service.js";

const router = express.Router();

// Route: Bắt đầu xác thực với Google
router.get("/google", (req, res, next) => {
  console.log("👉 Redirecting to Google for authentication...");
  passport.authenticate("google", {
    scope: ["profile", "email"], // Không truyền response_type vì không thuộc AuthenticateOptionsGoogle
  })(req, res, next);
});

// Route: Google callback sau khi người dùng xác thực
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login-failed" }),
  (req, res) => {
    console.log("✅ Google authentication successful:", req.user);

    const accessToken = AuthService.generateAccessToken(req.user);
    const refreshToken = AuthService.generateRefreshToken(req.user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, //  Set true nếu deploy bằng HTTPS
    });

    // Tuỳ: Redirect về frontend hoặc trả JSON
    // res.json({ accessToken });
    res.redirect(`http://localhost:3000/login?accessToken=${accessToken}`); // nếu dùng frontend
  }
);

router.get("/login-failed", (req, res) => {
  console.log("❌ Google login failed.");
  res.status(401).json({ message: "Đăng nhập bằng Google thất bại." });
});

export default router;
