import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import ActivityType from "../../enums/activityType.enum";
export class CreateActivityDto {
  @IsEnum(ActivityType)
  type!: ActivityType;


  @IsInt()
  order!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  dayId!: number;

}
