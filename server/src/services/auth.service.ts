import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import USER_ROLE from "../enums/userRole.enum";
import AUTH_PROVIDER from "../enums/authProvider.enum";
import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import dotenv from "dotenv";
import { User } from "../models/user";
import OtpService from "./otp.service";
import { hashPassword, comparePassword } from "../utils/hashPassword";

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.REFRESH_SECRET as string;

class AuthService {
  // Login
  static async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      throw new ApiError(HttpStatusCode.Unauthorized, "Sai tài khoản hoặc mật khẩu");
    }

    if (user.authProvider !== AUTH_PROVIDER.LOCAL || !user.password) {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        "Tài khoản này được đăng nhập bằng Google, không thể đăng nhập bằng mật khẩu"
      );
    }

    // So sánh mật khẩu đã hash
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(HttpStatusCode.Unauthorized, "Sai tài khoản hoặc mật khẩu");
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  // Tạo Access Token
  static generateAccessToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: "3h" }
    );
  }

  // Tạo Refresh Token
  static generateRefreshToken(user: User): string {
    return jwt.sign(
      { id: user.id, role: user.role },
      REFRESH_SECRET,
      { expiresIn: "1d" }
    );
  }

  // Register
  static async register(name: string, email: string, password: string, otp: string): Promise<User> {
    // Verify OTP
    await OtpService.verifyOtp(email, otp);

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    // Hash mật khẩu trước khi lưu
    const hashedPassword = await hashPassword(password);

    const newUser = userRepository.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: USER_ROLE.USER,
      authProvider: AUTH_PROVIDER.LOCAL,
    });

    return await userRepository.save(newUser);
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = this.verifyRefreshToken(refreshToken) as any;
      const user = await userRepository.findOne({ where: { id: payload.id } });

      if (!user) {
        throw new ApiError(HttpStatusCode.Unauthorized, "User không tồn tại");
      }

      return this.generateAccessToken(user);
    } catch (error: any) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Refresh token đã hết hạn");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Refresh token không hợp lệ");
      }
      throw error;
    }
  }

  // Verify refresh token
  static verifyRefreshToken(refreshToken: string): string | object {
    return jwt.verify(refreshToken, REFRESH_SECRET);
  }

  // Verify access token
  static verifyAccessToken(accessToken: string): string | object {
    return jwt.verify(accessToken, ACCESS_SECRET);
  }

  // Lấy user theo id
  static async getUserById(id: number): Promise<User> {
    const user = await userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    const sanitizedUser = { ...user } as User;
    sanitizedUser.password = null;
    return sanitizedUser;
  }
}

export default AuthService;
