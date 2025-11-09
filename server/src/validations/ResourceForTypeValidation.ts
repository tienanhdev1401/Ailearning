// validations/ResourceForTypeValidation.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { plainToInstance } from "class-transformer";
import { MatchImageWordResources } from "../dto/request/MinigameResourceDTO/MatchImageWordResources";
import EType from "../enums/minigameType.enum";

// 🔹 Map type → resource class
export const resourceClassMap: Record<EType, any> = {
  [EType.MATCH_IMAGE_WORD]: MatchImageWordResources,
  // thêm các type khác ở đây
};

// 🔹 Lấy class resource theo type, throw lỗi nếu không có
export const getResourceType = (type: EType): any => {
  if (!(type in resourceClassMap)) {
    throw new Error(`Không có resource class cho type ${type}`);
  }
  return resourceClassMap[type as EType];
};

// 🔹 Validator kiểm tra resources tương ứng với type
@ValidatorConstraint({ name: "ResourceForType", async: false })
export class ResourceForTypeValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const dto = args.object as any;
    if (!dto?.type) return false;

    // Lấy class resource tương ứng
    const ResourceClass = getResourceType(dto.type);
    if (!ResourceClass) return false;

    // Nếu value là object plain, convert sang instance để validate
    const instance = plainToInstance(ResourceClass, value);

    // Kiểm tra instance có phải class resource không
    return instance instanceof ResourceClass;
  }

  defaultMessage(args: ValidationArguments) {
    const dto = args.object as any;
    return `Resource không hợp lệ cho type "${dto?.type}"`;
  }
}
