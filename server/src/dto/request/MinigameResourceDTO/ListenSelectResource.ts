import { IsArray, IsInt, IsString, ValidateNested, IsUrl, Min, Max } from "class-validator";
import { Type } from "class-transformer";

class ListenOptionDTO {
  @IsString()
  text?: string;

  @IsString()
  @IsUrl()
  imageUrl?: string;
}

export class ListenSelectResources {
  @IsString()
  @IsUrl()
  audioUrl!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListenOptionDTO)
  options!: ListenOptionDTO[];

  @IsInt()
  @Min(0)
  correctIndex!: number;
}
