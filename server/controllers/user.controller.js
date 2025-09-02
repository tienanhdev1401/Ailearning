import { HttpStatusCode } from 'axios'
import UserService from '../services/user.service.js'
import nodemailer from 'nodemailer'

const otpStore = new Map(); // Không cần kiểu dữ liệu

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

class UserController {
  // Lấy danh sách tất cả người dùng
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(HttpStatusCode.Ok).json(users);
    } catch (error) {
      res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng", error: error.message });
    }
  }

  // Lấy người dùng theo ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(HttpStatusCode.NotFound).json({ message: "Không tìm thấy người dùng" });
      }

      res.status(HttpStatusCode.Ok).json(user);
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi lấy người dùng", error: error.message });
    }
  }

  // Tạo người dùng mới
  static async createUser(req, res) {
    try {
      const {name, email, password, role } = req.body;

      console.log(req.body);

      // Kiểm tra trùng email
      const existingUser = await UserService.findUserByEmail(email);
      if (existingUser) {
        return res.status(HttpStatusCode.BadRequest).json({ message: "Email đã tồn tại" });
      }

      const newUser = await UserService.createUser({ name, email, password, role });
      res.status(HttpStatusCode.Created).json(newUser);
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi tạo người dùng", error: error.message });
    }
  }

  // Cập nhật người dùng
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { email, role } = req.body;

      const updatedUser = await UserService.updateUser(id, { email, role });
      if (!updatedUser) {
        return res.status(HttpStatusCode.NotFound).json({ message: "Không tìm thấy người dùng để cập nhật" });
      }

      res.status(HttpStatusCode.Ok).json(updatedUser);
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi cập nhật người dùng", error: error.message });
    }
  }

  // Xoá người dùng
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const deleted = await UserService.deleteUser(id);
      if (!deleted) {
        return res.status(HttpStatusCode.NotFound).json({ message: "Không tìm thấy người dùng để xoá" });
      }

      res.status(HttpStatusCode.Ok).json({ message: "Xoá người dùng thành công" });
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ message: "Lỗi khi xoá người dùng", error: error.message });
    }
  }


  //gửi mã OTP
  static async sendVerificationCode(req, res) {
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
        from: process.env.EMAIL,
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

  static async resetPassword(req, res) {
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
      const user = await UserService.findByEmail(email);
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
