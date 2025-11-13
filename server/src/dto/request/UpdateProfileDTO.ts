import { IsOptional, IsString, IsDateString, Matches, IsEnum } from "class-validator";
import USER_GENDER from "../../enums/userGender.enum";
import USER_STATUS from "../../enums/userStatus.enum";

export class UpdateProfileDto {
  @IsString({ message: "Tên phải là chuỗi ký tự" })
  @IsOptional()
  name?: string;

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
}
