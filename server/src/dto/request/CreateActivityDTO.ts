import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import Skill from "../../enums/skill.enum";
export class CreateActivityDto {
  @IsEnum(Skill)
  skill!: Skill;

  @IsInt()
  pointOfAc!: number;

  @IsInt()
  order!: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  dayId!: number;

}
