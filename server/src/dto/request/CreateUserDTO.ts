import { IsString, IsEmail, IsEnum, IsNotEmpty, MinLength } from "class-validator";
import USER_ROLE from "../../enums/userRole.enum";
import AUTH_PROVIDER from "../../enums/authProvider.enum";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateUserDto:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *         - authProvider
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyễn Văn A"
 *           description: Tên của người dùng
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: Email của người dùng
 *         password:
 *           type: string
 *           example: "123456"
 *           description: Mật khẩu của người dùng, tối thiểu 6 ký tự
 *         role:
 *           type: string
 *           example: "user"
 *           description: Vai trò của người dùng
 *         authProvider:
 *           type: string
 *           example: "local"
 *           description: Phương thức xác thực của người dùng
 */
export class CreateUserDto {
  @IsString({ message: "Tên phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Tên không được để trống" })
  name!: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsNotEmpty({ message: "Email là bắt buộc" })
  email!: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  @IsNotEmpty({ message: "Mật khẩu không được để trống" })
  password!: string;

  @IsEnum(USER_ROLE, { message: `Role chỉ có thể là: ${Object.values(USER_ROLE).join(", ")}` })
  role!: USER_ROLE;

  @IsEnum(AUTH_PROVIDER, { message: `AuthProvider chỉ có thể là: ${Object.values(AUTH_PROVIDER).join(", ")}` })
  authProvider!: AUTH_PROVIDER;
}
