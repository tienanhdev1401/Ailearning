import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

/**
 * Middleware validate request body bằng DTO class-validator
 * @param dtoClass class DTO (ví dụ: LoginDto, RegisterDto)
 */
const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = dtoClass.fromPlain
      ? dtoClass.fromPlain(req.body)
      : plainToInstance(dtoClass, req.body);

    const errors: ValidationError[] = await validate(dtoObject, { 
      whitelist: true, 
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    });

    if (errors.length > 0) {
      // Format lỗi thành chuỗi
      const formattedErrors = errors
        .map(err => Object.values(err.constraints || {}).join(", "))
        .join("\n");
      return next(new ApiError(HttpStatusCode.BadRequest, formattedErrors));
    }

    // Gán lại body đã validate (loại bỏ các property không trong DTO)
    req.body = dtoObject;

    next();
  };
};

export default validateDto;
