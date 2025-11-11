import { IsEmail, IsOptional, IsString, MinLength, IsEnum, IsDateString, Matches } from "class-validator";
import USER_ROLE from "../../enums/userRole.enum";
import AUTH_PROVIDER from "../../enums/authProvider.enum";
import USER_GENDER from "../../enums/userGender.enum";
import USER_STATUS from "../../enums/userStatus.enum";

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Nguyễn Văn B"
 *           description: Tên của người dùng (tùy chọn)
 *         email:
 *           type: string
 *           format: email
 *           example: "newuser@example.com"
 *           description: Email mới của người dùng (tùy chọn)
 *         password:
 *           type: string
 *           example: "newpassword123"
 *           minLength: 6
 *           description: Mật khẩu mới của người dùng (tùy chọn, ít nhất 6 ký tự)
 *         role:
 *           type: string
 *           enum: [ADMIN, USER]
 *           example: "USER"
 *           description: Vai trò của người dùng
 *         authProvider:
 *           type: string
 *           enum: [LOCAL, GOOGLE, FACEBOOK]
 *           example: "LOCAL"
 *           description: Nguồn xác thực của người dùng
 *       description: Dữ liệu để cập nhật thông tin người dùng (các trường đều tùy chọn)
 */
export class UpdateUserDto {
  @IsString({ message: "Tên phải là chuỗi ký tự" })
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: "Email không hợp lệ" })
  @IsOptional()
  email?: string;

  @IsString({ message: "Mật khẩu phải là chuỗi ký tự" })
  @MinLength(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
  @IsOptional()
  password?: string;

    @IsString({ message: "Đường dẫn ảnh đại diện phải là chuỗi" })
    @IsOptional()
    avatarUrl?: string | null;

    @IsOptional()
    @Matches(/^[0-9+\-()\s]{6,20}$/u, {
      message: "Số điện thoại không hợp lệ",
    })
    phone?: string | null;

    @IsDateString({}, { message: "Ngày sinh không hợp lệ" })
    @IsOptional()
    birthday?: string | null;

    @IsEnum(USER_GENDER, {
      message: `Giới tính chỉ có thể là: ${Object.values(USER_GENDER).join(", ")}`,
    })
    @IsOptional()
    gender?: USER_GENDER | null;

    @IsEnum(USER_STATUS, {
      message: `Trạng thái chỉ có thể là: ${Object.values(USER_STATUS).join(", ")}`,
    })
    @IsOptional()
    status?: USER_STATUS;

  @IsEnum(USER_ROLE, {
    message: `Vai trò chỉ có thể là: ${Object.values(USER_ROLE).join(", ")}`,
  })
  @IsOptional()
  role?: USER_ROLE;

  @IsEnum(AUTH_PROVIDER, {
    message: `Nhà cung cấp xác thực chỉ có thể là: ${Object.values(AUTH_PROVIDER).join(", ")}`,
  })
  @IsOptional()
  authProvider?: AUTH_PROVIDER;
}
