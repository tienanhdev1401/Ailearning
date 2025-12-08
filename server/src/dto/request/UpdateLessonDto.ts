import { IsString, IsOptional, IsUrl, ValidateNested, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { IsSrtFile } from "../../validations/IsSrtFile";
import { TopicLessonType } from "../../enums/topicLessonType";
import { LessonLevel } from "../../enums/lessonLevel.enum";

export class SrtFileDto {
  @IsString()
  @IsOptional()
  originalname?: string;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl()
  video_url?: string;

  @IsOptional()
  @IsUrl()
  thumbnail_url?: string;

  @IsOptional()
  @IsEnum(TopicLessonType)
  topic_type?: TopicLessonType;

  @IsOptional()
  @IsEnum(LessonLevel)
  level?: LessonLevel;

  @IsOptional()
  @ValidateNested()
  @Type(() => SrtFileDto)
  @IsSrtFile({ message: "File phải có định dạng .srt" })
  srt_file?: SrtFileDto;
}
