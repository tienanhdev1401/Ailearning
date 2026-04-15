import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class WatchVideoResources {
  @IsString({ message: "hlsUrl phải là chuỗi" })
  @IsNotEmpty({ message: "hlsUrl không được để trống" })
  hlsUrl!: string; // 🔥 .m3u8

  @IsString({ message: "fallbackUrl phải là chuỗi" })
  @IsNotEmpty({ message: "fallbackUrl không được để trống" })
  fallbackUrl!: string;

  @IsOptional()
  @IsString({ message: "title phải là chuỗi" })
  title?: string;
}