import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { userRepository } from "../repositories/user.repository";
import { User } from "../models/user";
import AUTH_PROVIDER from "../enums/authProvider.enum";
import USER_ROLE from "../enums/userRole.enum";
import { CreateUserDto } from "../dto/request/CreateUserDTO";
import { UpdateUserDto } from "../dto/request/UpdateUserDTO";
import { UpdateProfileDto } from "../dto/request/UpdateProfileDTO";
import OtpService from "./otp.service";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import USER_GENDER from "../enums/userGender.enum";
import USER_STATUS from "../enums/userStatus.enum";
class UserService {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(): Promise<User[]> {
    const users = await userRepository.find();
    return users.map((user) => this.sanitizeUser(user));
  }

  // Tạo người dùng mới
  static async createUser(createUserDto: CreateUserDto): Promise<User> {

    // Kiểm tra trùng email
    const existingUser = await this.findUserByEmail(createUserDto.email);
    if (existingUser) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email đã tồn tại");
    }

    // Hash mật khẩu trước khi lưu
    const hashedPassword = await hashPassword(createUserDto.password);

    // Tạo user mới
    const newUser = userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
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

    return this.sanitizeUser(user);
  }

  // Tìm người dùng theo email
  static async findUserByEmail(email: string): Promise<User | null> {
    const user = await userRepository.findOne({ where: { email } });
    return user || null; 
  }

  // Cập nhật người dùng
  static async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await userRepository.findOne({ where: { id } });
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    const { birthday, phone, avatarUrl, gender, status, name, ...rest } = updateUserDto;

    if (Object.keys(rest).length > 0) {
      userRepository.merge(user, rest);
    }

    this.applyProfileFields(user, {
      birthday,
      phone,
      avatarUrl,
      gender,
      status,
      name,
    });

    const savedUser = await userRepository.save(user);
    return this.sanitizeUser(savedUser);
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

  static async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    this.applyProfileFields(user, updateProfileDto);

    const savedUser = await userRepository.save(user);
    return this.sanitizeUser(savedUser);
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
    // Hash mật khẩu trước khi lưu
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    
    await userRepository.save(user);
  }

  private static applyProfileFields(
    user: User,
    payload: {
      name?: string;
      avatarUrl?: string | null;
      phone?: string | null;
      birthday?: string | null;
      gender?: USER_GENDER | null;
      status?: USER_STATUS;
    }
  ): void {
    if (payload.name !== undefined) {
      const trimmed = payload.name?.trim();
      if (trimmed && trimmed.length > 0) {
        user.name = trimmed;
      }
    }

    if (payload.avatarUrl !== undefined) {
      user.avatarUrl = payload.avatarUrl ?? null;
    }

    if (payload.phone !== undefined) {
      const sanitizedPhone = payload.phone?.trim();
      user.phone = sanitizedPhone ? sanitizedPhone : null;
    }

    if (payload.birthday !== undefined) {
      user.birthday = payload.birthday ? new Date(payload.birthday) : null;
    }

    if (payload.gender !== undefined) {
      user.gender = payload.gender ?? null;
    }

    if (payload.status !== undefined) {
      user.status = payload.status;
    }
  }

  private static sanitizeUser(user: User): User {
    return { ...user, password: null } as User;
  }
}

export default UserService;
