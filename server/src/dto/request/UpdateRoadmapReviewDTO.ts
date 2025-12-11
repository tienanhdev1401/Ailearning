import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateRoadmapReviewDto {
  @IsOptional()
  @IsInt({ message: "rating phải là số nguyên" })
  @Min(1, { message: "rating tối thiểu là 1" })
  @Max(5, { message: "rating tối đa là 5" })
  rating?: number;

  @IsOptional()
  @IsString({ message: "comment phải là chuỗi" })
  @MaxLength(2000, { message: "comment tối đa 2000 ký tự" })
  comment?: string;
}
