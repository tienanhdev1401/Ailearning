import { IsArray, ValidateNested, IsString, IsNotEmpty, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class FlipCardItem {
  @IsString({ message: "Thuật ngữ phải là chuỗi" })
  @IsNotEmpty({ message: "Thuật ngữ không được để trống" })
  term!: string;

  @IsString({ message: "Định nghĩa phải là chuỗi" })
  @IsNotEmpty({ message: "Định nghĩa không được để trống" })
  definition!: string;

  @IsOptional()
  @IsString({ message: "Phiên âm phải là chuỗi" })
  phonetic?: string;

  @IsOptional()
  @IsString({ message: "Loại từ phải là chuỗi" })
  partOfSpeech?: string;
}

export class FlipCardResources {
  @IsArray({ message: "cards phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => FlipCardItem)
  cards!: FlipCardItem[];
}
