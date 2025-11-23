import { IsArray, ValidateNested, IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import Skill from "../../enums/skill.enum";

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
  @IsEnum(Skill)
  skill?: Skill;

  @IsOptional()
  @IsInt()
  pointOfAc?: number;
}

export class UpdateManyActivitiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateActivityItemDto)
  activities!: UpdateActivityItemDto[];
}
