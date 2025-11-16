import { IsString, IsNotEmpty, IsUrl, ValidateNested, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { IsSrtFile } from "../../validations/IsSrtFile";
import { TopicLessonType } from "../../enums/topicLessonType";
import { LessonLevel } from "../../enums/lessonLevel.enum";

/**
 * @swagger
 * components:
 *   schemas:
 *     SrtFileDto:
 *       type: object
 *       properties:
 *         originalname:
 *           type: string
 *           example: "subtitles.srt"
 *           description: Tên file phụ đề (.srt)
 *
 *     CreateLessonDto:
 *       type: object
 *       required:
 *         - title
 *         - video_url
 *         - thumbnail_url
 *         - srt_file
 *       properties:
 *         title:
 *           type: string
 *           example: "Princess Mononoke Scene 1"
 *           description: Tiêu đề bài học
 *         video_url:
 *           type: string
 *           format: uri
 *           example: "https://www.youtube.com/embed/vf6c6n35wr4"
 *           description: Link video bài học
 *         thumbnail_url:
 *           type: string
 *           format: uri
 *           example: "https://example.com/thumb.jpg"
 *           description: Ảnh thu nhỏ video
 *         srt_file:
 *           type: string
 *           format: binary
 *           description: File phụ đề (.srt)
 */

export class SrtFileDto {
  @IsString({ message: "Tên file phải là chuỗi" })
  @IsNotEmpty({ message: "File không được để trống" })
  originalname!: string;
}

export class CreateLessonDto {
  @IsString({ message: "Title phải là chuỗi" })
  @IsNotEmpty({ message: "Title không được để trống" })
  title!: string;

  @IsUrl({}, { message: "Video URL không hợp lệ" })
  @IsNotEmpty({ message: "Video URL không được để trống" })
  video_url!: string;

  @IsUrl({}, { message: "Thumbnail URL không hợp lệ" })
  @IsNotEmpty({ message: "Thumbnail URL không được để trống" })
  thumbnail_url!: string;

  @IsEnum(TopicLessonType, { message: "Topic Type không hợp lệ" })
  @IsNotEmpty({ message: "Topic Type không được để trống" })
  topic_type!: TopicLessonType;

  @IsEnum(LessonLevel, { message: "Level không hợp lệ" })
  @IsNotEmpty({ message: "Level không được để trống" })
  level!: LessonLevel;


  @ValidateNested()
  @Type(() => SrtFileDto)
  @IsSrtFile({ message: "File phải có định dạng .srt" })
  @IsNotEmpty({ message: "File SRT là bắt buộc" })
  srt_file!: SrtFileDto;
}
