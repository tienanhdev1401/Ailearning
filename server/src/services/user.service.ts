import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import User from "../models/user";

interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(): Promise<any[]> {
    return await User.findAll();
  }

  // Tạo người dùng mới
  static async createUser(user: CreateUserInput): Promise<any> {
    const { name, email, password, role } = user;

    // Kiểm tra trùng email
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    // Tạo user mới
    return await User.create({
      name,
      email,
      password, // nên hash password thật
      role,
      authProvider: "local",
    });
  }

  // Lấy người dùng theo ID
  static async getUserById(id: number): Promise<any> {
    return await User.findByPk(id);
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email: string): Promise<any> {
    return await User.findOne({ where: { email } });
  }

  // Cập nhật người dùng
  static async updateUser(id: number, updateData: Record<string, any>): Promise<any> {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.update(updateData);
    return user;
  }

  // Xoá người dùng
  static async deleteUser(id: number): Promise<boolean | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    await user.destroy();
    return true;
  }

  // Tìm người dùng theo email (hàm phụ)
  static async findByEmail(email: string): Promise<any> {
    return await User.findOne({ where: { email } });
  }

  // Cập nhật mật khẩu
  static async updatePassword(userId: number, newPassword: string): Promise<any> {
    const user = await User.findByPk(userId);
    if (!user) return null;

    await user.update({ password: newPassword });
    return user;
  }
}

export default UserService;
