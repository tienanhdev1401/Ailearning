import { HttpStatusCode } from "axios";
import AuthService from "../services/auth.service";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
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
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      const newUser = await AuthService.register(name, email, password);
      res.status(HttpStatusCode.Created).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      if (!token)
        throw new ApiError(HttpStatusCode.Unauthorized, "Không có refresh token");

      const accessToken = await AuthService.refreshAccessToken(token);
      res.status(HttpStatusCode.Ok).json({ accessToken });
    } catch (error) {
      next(error);
    }
  }

  static logout(req: Request, res: Response, next: NextFunction) {
    res.clearCookie("refreshToken");
    res.status(HttpStatusCode.Ok).json({ message: "Logout thành công" });
  }

  static async getMe(req: Request & { user?: any }, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getUserById(req.user.id);
      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
