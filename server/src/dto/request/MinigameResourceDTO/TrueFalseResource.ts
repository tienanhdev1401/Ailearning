import { IsArray, IsIn, IsOptional, IsString, ValidateNested, ArrayMaxSize, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

class TrueFalseOptionDTO {
  @IsString()
  @IsIn(["A", "B"])
  key!: "A" | "B";

  @IsString()
  label!: string;
}

export class TrueFalseResources {
  @IsString()
  statement!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => TrueFalseOptionDTO)
  options!: TrueFalseOptionDTO[];

  @IsString()
  @IsIn(["A", "B"])
  correctOption!: "A" | "B";

  @IsOptional()
  @IsString()
  explanation?: string;
}
