import { IsArray, ValidateNested, IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import ActivityType from "../../enums/activityType.enum";

class UpdateActivityItemDto {
  @IsInt()
  id!: number;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;
}

export class UpdateManyActivitiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateActivityItemDto)
  activities!: UpdateActivityItemDto[];
}
