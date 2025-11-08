import { HttpStatusCode } from "axios";
import AuthService from "../services/auth.service";
import OtpService from "../services/otp.service";
import UserService from "../services/user.service";
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
      const { name, email, password, otp } = req.body;

      const newUser = await AuthService.register(name, email, password, otp);
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

  // Gửi OTP
  static async sendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        throw new ApiError(HttpStatusCode.BadRequest, "Vui lòng cung cấp email");
      }

      await OtpService.sendOtp(email);
      res.status(HttpStatusCode.Ok).json({message: "Mã xác thực đã được gửi đến email của bạn"});
    } catch (error) {
      next(error);
    }
  }

  // Xác minh OTP
  static async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        throw new ApiError(HttpStatusCode.BadRequest, "Vui lòng cung cấp email và mã OTP");
      }

      await OtpService.verifyOtp(email, otp);

      res.status(HttpStatusCode.Ok).json({message: "Xác thực OTP thành công"});
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        throw new ApiError(HttpStatusCode.BadRequest, "Vui lòng nhập đầy đủ thông tin");
      }

      await UserService.resetPassword(email, otp, newPassword);

      res.status(HttpStatusCode.Ok).json({message: "Đặt lại mật khẩu thành công"});
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
