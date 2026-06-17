import { IsString, IsOptional, ValidateIf } from "class-validator";

export class WatchVideoResources {
  // --- Video upload (HLS / MP4) ---
  // Bắt buộc khi KHÔNG có youtubeUrl, nhưng phải là optional về mặt kiểu để không lỗi khi undefined
  @IsOptional()
  @ValidateIf((o) => !o.youtubeUrl && o.hlsUrl !== undefined)
  @IsString({ message: "hlsUrl phải là chuỗi" })
  hlsUrl?: string; // 🔥 .m3u8

  @IsOptional()
  @ValidateIf((o) => !o.youtubeUrl && o.fallbackUrl !== undefined)
  @IsString({ message: "fallbackUrl phải là chuỗi" })
  fallbackUrl?: string;

  // --- YouTube URL (tuỳ chọn thay thế) ---
  @IsOptional()
  @IsString({ message: "youtubeUrl phải là chuỗi" })
  youtubeUrl?: string; // 🎬 https://www.youtube.com/watch?v=... hoặc https://youtu.be/...

  @IsOptional()
  @IsString({ message: "title phải là chuỗi" })
  title?: string;
}