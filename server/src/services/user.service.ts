import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { User } from "../models/user";
import AUTH_PROVIDER from "../enums/authProvider.enum";
import USER_ROLE from "../enums/userRole.enum";
import { CreateUserDto } from "../dto/request/CreateUserDTO";
import { UpdateUserDto } from "../dto/request/UpdateUserDTO";
import OtpService from "./otp.service";
class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(): Promise<User[]> {
    return await userRepository.find();
  }

  // Tạo người dùng mới
  static async createUser(createUserDto: CreateUserDto): Promise<User> {

    // Kiểm tra trùng email
    const existingUser = await this.findUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    // Tạo user mới
    const newUser = userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password, 
      role: createUserDto.role,
      authProvider: AUTH_PROVIDER.LOCAL,
    });

    return await userRepository.save(newUser);
  }

  // Lấy người dùng theo ID
  static async getUserById(id: number): Promise<User> {
    const user = await userRepository.findOne({ where: { id } });

    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    return user;
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email: string): Promise<User | null> {
    const user = await userRepository.findOne({ where: { email } });
    return user || null; 
  }

  // Cập nhật người dùng
  static async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getUserById(id); 

    userRepository.merge(user, updateUserDto);
    return await userRepository.save(user);
  }

  // Xoá người dùng
  static async deleteUser(id: number): Promise<boolean | null> {
    const user = await this.getUserById(id);
    if (!user) return null;

    await userRepository.remove(user);
    return true;
  }



  // Cập nhật mật khẩu
  static async updatePassword(userId: number, newPassword: string): Promise<User | null> {
    const user = await this.getUserById(userId);
    if (!user) return null;

    user.password = newPassword; // giữ nguyên logic
    return await userRepository.save(user);
  }


  static async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    if (!email || !otp || !newPassword) {
      throw new ApiError(HttpStatusCode.BadRequest, "Vui lòng nhập đầy đủ thông tin");
    }

    // Xác minh OTP (tự động xóa sau khi đúng)
    await OtpService.verifyOtp(email, otp);
    // Tìm người dùng
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }
    user.password = newPassword;
    await userRepository.save(user);
  }
}

export default UserService;
