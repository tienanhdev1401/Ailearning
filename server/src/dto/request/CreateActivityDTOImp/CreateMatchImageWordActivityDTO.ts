// src/dto/request/CreateMatchImageWordActivityDto.ts
import { IsArray, ValidateNested, IsInt, IsString } from "class-validator";
import { Type } from "class-transformer";
import { CreateActivityDto } from "../CreateActivityDTO"

class ImageResource {
  @IsInt()
  id!: number;

  @IsString()
  imageUrl!: string;

  @IsString()
  correctWord!: string;
}

export class CreateMatchImageWordActivityDto extends CreateActivityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageResource)
  resources!: {
    images: ImageResource[];
  };
}
