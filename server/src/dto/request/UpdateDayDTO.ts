import { IsInt, IsOptional, IsString } from "class-validator";

export class UpdateDayDto {
  @IsOptional()
  @IsInt()
  dayNumber?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  condition?: number;

}
