import { HttpStatusCode } from "axios";
import AuthService from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";

class AuthController {
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login(email, password);
      
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: false,
      });

      res.status(HttpStatusCode.Ok).json({ accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  }

  // Đăng ký người dùng
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      const newUser = await AuthService.register(name, email, password);
      res.status(HttpStatusCode.Created).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  // static async refreshToken(req, res, next) {
  //   const token = req.cookies.refreshToken;
  //   if (!token) 
  //     throw new ApiError(HttpStatusCode.Unauthorized,"Không có refresh token" );

  //   try {
  //     const payload = AuthService.verifyRefreshToken(token);
  //     const accessToken = AuthService.generateAccessToken(payload);
  //     res.status(HttpStatusCode.Ok).json({ accessToken });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  static async refreshToken(req, res, next) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) 
      throw new ApiError(HttpStatusCode.Unauthorized,"Không có refresh token" );

      const accessToken = await AuthService.refreshAccessToken(token);
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

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
