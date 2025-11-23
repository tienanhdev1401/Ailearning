import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import Skill from "../../enums/skill.enum";

export class UpdateActivityDto {
  @IsOptional()
  @IsEnum(Skill)
  skill?: Skill;

  @IsOptional()
  @IsInt()
  pointOfAc?: number;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  title?: string;
}
