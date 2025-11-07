import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from "class-validator";

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterDto:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - otp
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyễn Văn A"
 *           description: Tên đầy đủ của người dùng
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: Địa chỉ email của người dùng (duy nhất)
 *         password:
 *           type: string
 *           example: "123456"
 *           minLength: 6
 *           description: Mật khẩu của người dùng (tối thiểu 6 ký tự)
 *         otp:
 *           type: string
 *           example: "123456"
 *           description: Mã OTP gồm 6 chữ số được gửi tới email để xác thực đăng ký
 */
export class RegisterDto {
  @IsString({ message: "Tên phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Tên không được để trống" })
  name!: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty({ message: "Email là bắt buộc" })
  email!: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  password!: string;

  @IsString({ message: "OTP phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "OTP không được để trống" })
  @Matches(/^\d{6}$/, { message: "OTP phải gồm 6 chữ số" })
  otp!: string;
}
