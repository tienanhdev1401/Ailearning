import { HttpStatusCode } from 'axios'
import UserService from '../services/user.service'
import transporter from '../utils/mailTransporter'
import ApiError from '../utils/ApiError';
import { CreateUserDto } from '../dto/request/CreateUserDTO'
import { UpdateUserDto } from '../dto/request/UpdateUserDTO';
import { Request, Response, NextFunction } from "express";
import { plainToInstance } from "class-transformer";

const otpStore = new Map<string, { otp: string; expires: Date; userData: { email: string } }>();

class UserController {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers();
      res.status(HttpStatusCode.Ok).json(users);
    } catch (error) {
      next(error)
    }
  }

  // Lấy người dùng theo ID
  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const user = await UserService.getUserById(id);
      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      next(error);
    }
  }

  // Tạo người dùng mới
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const createUserDto = plainToInstance(CreateUserDto, req.body);
      const newUser = await UserService.createUser(createUserDto);
      res.status(HttpStatusCode.Created).json(newUser);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật người dùng
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updateUserDto = plainToInstance(UpdateUserDto, req.body);

      const updatedUser = await UserService.updateUser(id, updateUserDto);
      if (!updatedUser) {
        throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng để cập nhật");
      }

      res.status(HttpStatusCode.Ok).json(updatedUser);
    } catch (error: any) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi cập nhật người dùng", error: error.message });
    }
  }

  // Xoá người dùng
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);

      const deleted = await UserService.deleteUser(id);
      if (!deleted) {
        return res.status(HttpStatusCode.NotFound).json({ message: "Không tìm thấy người dùng để xoá" });
      }

      res.status(HttpStatusCode.Ok).json({ message: "Xoá người dùng thành công" });
    } catch (error: any) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi xoá người dùng", error: error.message });
    }
  }

  //gửi mã OTP
  static async sendVerificationCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
  
      if (!email) {
        res.status(HttpStatusCode.BadRequest).json({ error: 'Vui lòng nhập email' });
        return;
      }
      
      // Generate OTP code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
      // Store OTP with expiration (10 minutes)
      otpStore.set(email, {
        otp,
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        userData: { email }
      });
  
      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Mã xác thực tạo tài khoản',
        text: `Mã xác thực của bạn là: ${otp}`
      });
  
      res.status(HttpStatusCode.Ok).json({
        success: true,
        message: 'Mã xác thực đã được gửi đến email của bạn'
      });
    } catch (error) {
      console.error('Lỗi gửi mã xác thực:', error);
      res.status(HttpStatusCode.InternalServerError).json({ error: 'Lỗi máy chủ' });
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
  
      if (!email || !otp || !newPassword) {
        res.status(HttpStatusCode.BadRequest).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        return;
      }
  
      // Kiểm tra mã OTP
      const otpData = otpStore.get(email);
      if (!otpData) {
        res.status(HttpStatusCode.BadRequest).json({
          success: false,
          message: 'Bạn cần gửi mã xác thực trước'
        });
        return;
      }
  
      // Kiểm tra mã OTP có hết hạn không
      if (new Date() > otpData.expires) {
        otpStore.delete(email);
        res.status(HttpStatusCode.BadGateway).json({
          success: false,
          message: 'Mã xác thực đã hết hạn, vui lòng yêu cầu mã mới'
        });
        return;
      }
  
      // Kiểm tra mã xác thực
      if (otp !== otpData.otp) {
        res.status(HttpStatusCode.Unauthorized).json({
          success: false,
          message: 'Mã xác thực không đúng'
        });
        return;
      }
  
      // Tìm người dùng theo email
      const user = await UserService.findUserByEmail(email);
      if (!user) {
        res.status(HttpStatusCode.NotFound).json({ error: 'Người dùng không tồn tại' });
        return;
      }
  
      // Mã hóa mật khẩu mới
      // const hashedNewPassword = await authRepository.hashPassword(newPassword);
  
      // Cập nhật mật khẩu
      if (!user.id) {
        throw new Error('User ID không hợp lệ');
      }
  
      console.log(user)
      await UserService.updatePassword(user.id, newPassword);
  
      // Xóa mã OTP sau khi đổi mật khẩu thành công
      otpStore.delete(email);
  
      res.status(HttpStatusCode.Ok).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
  
    } catch (error) {
      console.error('Lỗi reset mật khẩu:', error);
      res.status(HttpStatusCode.InternalServerError).json({ error: 'Lỗi máy chủ' });
    }
  }
}

export default UserController;
