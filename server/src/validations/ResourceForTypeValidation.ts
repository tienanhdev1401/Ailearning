// validations/ResourceForTypeValidation.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator";
import { plainToInstance } from "class-transformer";
import { MatchImageWordResources } from "../dto/request/MinigameResourceDTO/MatchImageWordResources";
import { LessonResources } from "../dto/request/MinigameResourceDTO/LessonResources";
import { ExamResources } from "../dto/request/MinigameResourceDTO/ExamResource";
import { SentenceBuilderResources } from "../dto/request/MinigameResourceDTO/SentenceBuilderResources";
import { ListenSelectResources } from "../dto/request/MinigameResourceDTO/ListenSelectResources";
import EType from "../enums/minigameType.enum";
import { TrueFalseResources } from "../dto/request/MinigameResourceDTO/TrueFalseResource";
import { TypingChallengeResources } from "../dto/request/MinigameResourceDTO/TypingChallengeResource";

// 🔹 Map type → resource class
export const resourceClassMap: Record<EType, any> = {
  [EType.MATCH_IMAGE_WORD]: MatchImageWordResources,
  [EType.LESSON]: LessonResources,
  [EType.EXAM]: ExamResources,
  [EType.SENTENCE_BUILDER]: SentenceBuilderResources,
  [EType.LISTEN_SELECT]: ListenSelectResources,
  [EType.TRUE_FALSE]: TrueFalseResources,
  [EType.TYPING_CHALLENGE]: TypingChallengeResources,
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
