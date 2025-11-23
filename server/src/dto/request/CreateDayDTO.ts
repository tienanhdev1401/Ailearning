// src/dto/request/CreateDayDTO.ts
import { IsInt, IsOptional, IsString,  } from "class-validator";

export class CreateDayDto {
  @IsInt()
  dayNumber!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  condition?: number;

}
