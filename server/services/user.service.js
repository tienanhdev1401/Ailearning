import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";

class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers() {
    return await prisma.users.findMany();
  }

  // Tạo người dùng mới
  // static async createUser({ name, email, password, role }) {
  //   return await User.create({ name, email, password, role,  authProvider: 'local'});
  // }

  static async createUser(user) {
    const { name, email, password, role } = user;

    // Kiểm tra trùng email (business logic nên ở service)
    const existingUser = await this.findUserByEmail(email);
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    return await prisma.users.create({
      data: { name, email, password, role, authProvider: 'local' }
    });
  }

  // Lấy người dùng theo ID
  static async getUserById(id) {
    return await prisma.users.findUnique({ where: { id: Number(id) } });
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email) {
    return await prisma.users.findUnique({ where: { email } });
  }

  // Cập nhật người dùng
  static async updateUser(id, updateData) {
    try {
      return await prisma.users.update({ where: { id: Number(id) }, data: updateData });
    } catch (e) {
      return null;
    }
  }

  // Xoá người dùng
  static async deleteUser(id) {
    try {
      await prisma.users.delete({ where: { id: Number(id) } });
      return true;
    } catch (e) {
      return null;
    }
  }

  // Tìm người dùng theo email
  static async findByEmail(email) {
    return await prisma.users.findUnique({ where: { email } });
  }

  // Cập nhật mật khẩu người dùng (có mã hóa)
  static async updatePassword(userId, newPassword) {
    try {
      return await prisma.users.update({ where: { id: Number(userId) }, data: { password: newPassword } });
    } catch (e) {
      return null;
    }
  }
}

export default UserService;