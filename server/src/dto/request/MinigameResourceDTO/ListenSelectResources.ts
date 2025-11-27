import { IsArray, ValidateNested, IsString, IsInt, IsUrl, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class ListenSelectOption {
  @IsInt()
  id!: number;

  @IsString()
  text!: string;

  @IsUrl({}, { message: "imageUrl phải là URL hợp lệ" })
  imageUrl!: string;
}

export class ListenSelectResources {
  @IsArray({ message: "options phải là một mảng" })
  @ValidateNested({ each: true })
  @Type(() => ListenSelectOption)
  options!: ListenSelectOption[];

  @IsUrl({}, { message: "audioUrl phải là URL hợp lệ" })
  audioUrl!: string;

  @IsInt({ message: "correctIndex phải là số" })
  @Min(0)
  correctIndex!: number;
}
