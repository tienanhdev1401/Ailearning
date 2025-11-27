import { IsArray, ValidateNested, IsInt, IsString } from "class-validator";
import { Type } from "class-transformer";

export class SentenceToken {
  @IsInt()
  id!: number;

  @IsString()
  text!: string;
}

export class SentenceBuilderResources {
  @IsArray({ message: "tokens phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => SentenceToken)
  tokens!: SentenceToken[];
}