import { IsEnum, IsString, IsOptional, Validate, ValidateNested, IsInt } from "class-validator";
import { Type } from "class-transformer";
import EType from "../../enums/minigameType.enum";
import { ResourceForTypeValidator, getResourceType } from "../../validations/ResourceForTypeValidation";

export class CreateMiniGameDto {
  @IsEnum(EType)
  type!: EType;

  @IsString()
  prompt!: string;

  @IsOptional()
  @Validate(ResourceForTypeValidator) // check có class resource tương ứng
  @ValidateNested()
  @Type((options) => {
    const dto = options?.object as CreateMiniGameDto;
    if (!dto || !dto.type) return Object; // fallback tránh undefined
    return getResourceType(dto.type); // trả về class resource đúng
  })
  resources?: any;

  @IsInt()
  activityId!: number; // validate existence ở service
}
