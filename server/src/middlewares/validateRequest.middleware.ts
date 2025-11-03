import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

// Hàm format error từ ValidationError (recursive)
const formatErrors = (errors: ValidationError[]): string => {
  return errors
    .flatMap(err => {
      if (err.children && err.children.length > 0) {
        return formatErrors(err.children).split("\n");
      }
      return Object.values(err.constraints || []);
    })
    .filter(Boolean)
    .join("\n");
};


const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = dtoClass.fromPlain
      ? dtoClass.fromPlain(req.body)
      : plainToInstance(dtoClass, req.body);

    const errors: ValidationError[] = await validate(dtoObject, {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false, 
      validationError: { target: false },
    });

    if (errors.length > 0) {
      const formattedErrors = formatErrors(errors);
      return next(new ApiError(HttpStatusCode.BadRequest, formattedErrors));
    }

    req.body = dtoObject;
    next();
  };
};

export default validateDto;
