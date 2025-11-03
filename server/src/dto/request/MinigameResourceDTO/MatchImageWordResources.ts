// dto/resources/MatchImageWordResources.ts
import { IsArray, ValidateNested, IsInt, IsString, IsUrl } from "class-validator";
import { Type } from "class-transformer";

export class MatchImageItem {
  @IsInt()
  id!: number;

  @IsUrl({}, { message: "imageUrl phải là URL hợp lệ" })
  imageUrl!: string;

  @IsString({ message: "correctWord phải là string" })
  correctWord!: string;
}

export class MatchImageWordResources {
  @IsArray({ message: "images phải là mảng" })
  @ValidateNested({ each: true })
  @Type(() => MatchImageItem)
  images!: MatchImageItem[];
}
