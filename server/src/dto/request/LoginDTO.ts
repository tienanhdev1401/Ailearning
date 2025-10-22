import { IsDefined, IsNotEmpty, IsEmail, IsString, ValidateIf } from "class-validator";

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           example: "123456"
 */
export class LoginDto {
  // Email
  @IsDefined({ message: "Email là bắt buộc" })         // check field missing
  @IsNotEmpty({ message: "Email không được để trống" }) // check rỗng
  @IsEmail({}, { message: "Email không hợp lệ" })        // check format
  email!: string;

  // Password
  @IsDefined({ message: "Mật khẩu là bắt buộc" })    
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  password!: string;
}
