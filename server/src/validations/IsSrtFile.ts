import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsSrtFile(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsSrtFile",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value.originalname !== "string") return false;
          return value.originalname.toLowerCase().endsWith(".srt");
        },
        defaultMessage(args: ValidationArguments) {
          return "File phải có định dạng .srt";
        },
      },
    });
  };
}
