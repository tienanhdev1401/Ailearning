import jwt from "jsonwebtoken";
import User from "../models/user.js";
import USER_ROLE from "../enums/userRole.enum.js";
import AUTH_PROVIDER from "../enums/authProvider.enum.js";
import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError.js";

import dotenv from "dotenv";
dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

class AuthService {

  static async login(email, password) {
    // Tìm user bằng email
    const user = await User.findOne({ where: { email, password } });
    if (!user) {
      throw new ApiError(HttpStatusCode.Unauthorized, "Sai tài khoản hoặc mật khẩu");
    }

    // // So sánh mật khẩu (đã hash)
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   throw new ApiError(HttpStatusCode.Unauthorized, "Sai tài khoản hoặc mật khẩu");
    // }

    // Tạo tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { accessToken, refreshToken};
  }

  static generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      ACCESS_SECRET,
      { expiresIn: "30s" }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      REFRESH_SECRET,
      { expiresIn: "1m" }
    );
  }

  static async register(name, email, password) {
    // Kiểm tra trùng email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    // Tạo user
    return await User.create({ name, email, password, role: USER_ROLE.USER,  authProvider: AUTH_PROVIDER.LOCAL });
  }
  

  static async refreshAccessToken(refreshToken) {
    try {
      const payload = this.verifyRefreshToken(refreshToken);
      console.log(REFRESH_SECRET,ACCESS_SECRET);
      console.log(refreshToken);
      
      // Kiểm tra user có tồn tại không
      const user = await User.findByPk(payload.id);
      if (!user) {
        throw new ApiError(HttpStatusCode.Unauthorized, "User không tồn tại");
      }

      return this.generateAccessToken(user);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Refresh token đã hết hạn");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Refresh token không hợp lệ");
      }
      throw error;
    }
  }
  

  static verifyRefreshToken(refreshToken) {
    return jwt.verify(refreshToken, REFRESH_SECRET);
  }

  static verifyAccessToken(accessToken) {
    return jwt.verify(accessToken, ACCESS_SECRET);
  }

  static async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email", "role"],
    });

    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    return user;
  }
  
}

export default AuthService;