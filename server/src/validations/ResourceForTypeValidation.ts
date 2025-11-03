// validations/ResourceForTypeValidation.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { MatchImageWordResources } from "../dto/request/MinigameResourceDTO/MatchImageWordResources";
import EType from "../enums/minigameType.enum";

// Map type → resource class
export const resourceClassMap: Record<EType, any> = {
  [EType.MATCH_IMAGE_WORD]: MatchImageWordResources,
};

// Lấy class resource theo type, throw lỗi nếu không có
export const getResourceType = (type: EType): any => {
  if (!(type in resourceClassMap)) {
    throw new Error(`Không có resource class cho type ${type}`);
  }
  return resourceClassMap[type as EType];
};

// Custom validator kiểm tra existence của class resource cho type
@ValidatorConstraint({ name: "ResourceForType", async: false })
export class ResourceForTypeValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as any;
    if (!dto?.type) return false;

    if (!(dto.type in resourceClassMap)) return false; // kiểm tra runtime
    const ResourceClass = resourceClassMap[dto.type as EType];
    return !!ResourceClass;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as any;
    return `Không có resource class tương ứng cho type ${dto?.type}`;
  }
}

