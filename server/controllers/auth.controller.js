import { HttpStatusCode } from "axios";
import AuthService from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";

class AuthController {
  static async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await AuthService.authenticateUser(email, password);
      if (!user) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Sai tài khoản hoặc mật khẩu");
      }

      const accessToken = AuthService.generateAccessToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      });

      res.status(HttpStatusCode.Ok).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    const token = req.cookies.refreshToken;
    if (!token) 
      throw new ApiError(HttpStatusCode.Unauthorized,"Không có refresh token" );

    try {
      const payload = AuthService.verifyRefreshToken(token);
      const accessToken = AuthService.generateAccessToken(payload);
      res.status(HttpStatusCode.Ok).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  static logout(req, res, next) {
    // const token = req.cookies.refreshToken;
    // if (!token) return res.sendStatus(204);

    res.clearCookie("refreshToken");
    res.status(HttpStatusCode.Ok).json({ message: "Logout thành công" });
  }

  static async getMe(req, res) {
    try {
      const user = await AuthService.getUserById(req.user.id);

      if (!user) {
        throw ApiError(HttpStatusCode.NotFound,"Không tìm thấy người dùng");
      }

      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
