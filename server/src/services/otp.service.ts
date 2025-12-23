import { User } from "../models/user";
import transporter from "../utils/mailTransporter";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

// Bộ nhớ tạm chứa OTP
const otpStore = new Map<string, { otp: string; expires: Date; userData: Partial<User> }>();

export class OtpService {
  // Tạo mã OTP ngẫu nhiên gồm 6 chữ số
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Gửi OTP qua email
  static async sendOtp(email: string): Promise<void> {
    if (!email) {
      throw new ApiError(HttpStatusCode.BadRequest, "Email không hợp lệ");
    }

    const otp = this.generateOtp();

    // Lưu OTP vào Map
    otpStore.set(email, {
      otp,
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
      userData: { email },
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Mã xác thực tài khoản",
        text: `Mã xác thực của bạn là: ${otp}\n\nMã này sẽ hết hạn sau 10 phút.`,
      });
    } catch (err) {
      console.error("Lỗi gửi mail:", err);
      throw new ApiError(HttpStatusCode.InternalServerError, "Không thể gửi email xác thực");
    }
  }

  // Xác minh OTP
  static async verifyOtp(email: string, otp: string): Promise<boolean> {
    const record = otpStore.get(email);

    if (!record) {
      throw new ApiError(HttpStatusCode.BadRequest, "Không tìm thấy mã OTP cho email này");
    }

    // Hết hạn
    if (record.expires.getTime() < Date.now()) {
      otpStore.delete(email);
      throw new ApiError(HttpStatusCode.BadRequest, "Mã OTP đã hết hạn");
    }

    // Sai mã
    if (record.otp !== otp) {
      throw new ApiError(HttpStatusCode.BadRequest, "Mã OTP không chính xác");
    }

    // ✅ Nếu hợp lệ thì xóa OTP để tránh dùng lại
    otpStore.delete(email);
    return true;
  }
}

export default OtpService;