// src/dto/request/CreateDayDTO.ts
import { IsInt, IsOptional, IsString,  } from "class-validator";

export class CreateDayDto {
  @IsInt()
  dayNumber!: number;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  condition?: number;

  @IsInt()
  roadmapId!: number;
}
