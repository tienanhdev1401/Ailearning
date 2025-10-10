import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";
import UserRepository from "../repositories/UserRepository.js";

const userRepository = new UserRepository()

class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers() {
    return await userRepository.findAll();
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

    return await userRepository.create({ name, email, password, role, authProvider: 'local' })
  }

  // Lấy người dùng theo ID
  static async getUserById(id) {
    const user = await userRepository.findById(id)
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng")
    }
    return user
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email) {
    return await userRepository.findByEmail(email)
  }

  // Cập nhật người dùng
  static async updateUser(id, updateData) {
    const exists = await userRepository.findById(id)
    if (!exists) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng")
    }
    return await userRepository.update(id, updateData)
  }

  // Xoá người dùng
  static async deleteUser(id) {
    const exists = await userRepository.findById(id)
    if (!exists) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng")
    }
    await userRepository.delete(id)
    return true
  }

  // Tìm người dùng theo email
  static async findByEmail(email) {
    return await userRepository.findByEmail(email)
  }

  // Cập nhật mật khẩu người dùng (có mã hóa)
  static async updatePassword(userId, newPassword) {
    const exists = await userRepository.findById(userId)
    if (!exists) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng")
    }
    return await userRepository.update(userId, { password: newPassword })
  }
}

export default UserService;