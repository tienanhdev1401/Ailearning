// dto/request/UpdateMiniGameDTO.ts
import { IsEnum, IsString, IsOptional, Validate, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import EType from "../../enums/minigameType.enum";
import { ResourceForTypeValidator, getResourceType } from "../../validations/ResourceForTypeValidation";



export class UpdateMiniGameDto {
  @IsOptional()
  @IsEnum(EType)
  type?: EType;

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @Validate(ResourceForTypeValidator)
  @ValidateNested()
  @Type((obj) => getResourceType(obj?.object?.type))
  resources?: any;
}
