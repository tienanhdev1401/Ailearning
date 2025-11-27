import { IsArray, IsInt, IsString, Length, Min, Max, ValidateNested, ArrayMinSize, ArrayMaxSize  } from "class-validator";
import { Type } from "class-transformer";

export class ExamQuestion {
  @IsString()
  question!: string;

  @IsArray({ message: "options phải là mảng" })
  @ArrayMinSize(4, { message: "Mỗi câu phải có đúng 4 đáp án" })
  @ArrayMaxSize(4, { message: "Mỗi câu phải có đúng 4 đáp án" })
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex!: number; // 0 → A, 1 → B, 2 → C, 3 → D
}

export class ExamResources {
  @IsArray({ message: "questions phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => ExamQuestion)
  questions!: ExamQuestion[];
}
