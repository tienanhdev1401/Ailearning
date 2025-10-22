import { IsNotEmpty, IsString, MinLength, MaxLength, IsUrl } from "class-validator";


/**
 * @swagger
 * components:
 *   schemas:
 *     PronunciationScoreDto:
 *       type: object
 *       required:
 *         - text
 *         - audioUrl
 *       properties:
 *         text:
 *           type: string
 *           example: "The quick brown fox jumps over the lazy dog"
 *           description: Chuỗi văn bản mà người dùng cần phát âm để chấm điểm
 *           minLength: 3
 *           maxLength: 1000
 *         audioUrl:
 *           type: string
 *           format: url
 *           example: "https://example.com/audio/sample.wav"
 *           description: Đường dẫn đến file âm thanh người dùng đã ghi âm (HTTP hoặc HTTPS)
 */
export class PronunciationScoreDto {
  @IsString({ message: "'text' phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "'text' không được để trống" })
  @MinLength(3, { message: "'text' tối thiểu 3 ký tự" })
  @MaxLength(1000, { message: "'text' tối đa 1000 ký tự" })
  text!: string;

  @IsUrl({ protocols: ["http", "https"] }, { message: "'audioUrl' phải là URL hợp lệ (http/https)" })
  @IsNotEmpty({ message: "'audioUrl' là bắt buộc" })
  audioUrl!: string;
}
