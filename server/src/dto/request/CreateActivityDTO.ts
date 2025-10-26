import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional } from "class-validator";
import Skill from "../../enums/skill.enum";
import { plainToInstance } from "class-transformer";
import ActivityType from "../../enums/activityType.enum";
import { CreateMatchImageWordActivityDto } from "./CreateActivityDTOImp/CreateMatchImageWordActivityDTO";

export class CreateActivityDto {
  @IsEnum(Skill)
  skill!: Skill;

  @IsEnum(ActivityType)
  type!: ActivityType;

  @IsInt()
  pointOfAc!: number;

  @IsInt()
  order!: number;

  @IsInt()
  dayId!: number;

  @IsOptional()
  @IsObject()
  resources?: Record<string, any>;


  // Tự động nhận dạng và validate DTO con
  static fromPlain(plain: any): CreateActivityDto {
    switch (plain.type) {
      case ActivityType.MATCH_IMAGE_WORD:
        return plainToInstance(CreateMatchImageWordActivityDto, plain);
      default:
        return plainToInstance(CreateActivityDto, plain);
    }
  }
}
