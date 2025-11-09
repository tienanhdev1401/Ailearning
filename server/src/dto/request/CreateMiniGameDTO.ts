// dto/request/CreateMiniGameDTO.ts
import { IsEnum, IsString, IsOptional, Validate, ValidateNested, IsInt, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import MiniGameType from "../../enums/minigameType.enum";
import { ResourceForTypeValidator, getResourceType } from "../../validations/ResourceForTypeValidation";

export class CreateMiniGameDto {
  @IsNotEmpty({ message: 'type không được để trống' })
  @IsEnum(MiniGameType, { message: `type phải là một trong: ${Object.values(MiniGameType).join(', ')}` })
  type!: MiniGameType;

  @IsString()
  prompt!: string;

  @IsOptional()
  @Validate(ResourceForTypeValidator) // check existence + type resource
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
