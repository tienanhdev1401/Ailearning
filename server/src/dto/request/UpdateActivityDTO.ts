import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import ActivityType from "../../enums/activityType.enum";

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;


  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  title?: string;
}
