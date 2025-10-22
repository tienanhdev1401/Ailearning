import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

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
}
