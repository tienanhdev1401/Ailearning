import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

/**
 * Middleware validate request body bằng Joi schema.
 */
const validateRequest = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const formattedError = error.details
        .map((d) => d.message)
        .join("\n");

      return next(new ApiError(HttpStatusCode.BadRequest, formattedError));
    }

    next();
  };
};

export default validateRequest;
