import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const formattedError = error.details
        .map((d) => d.message) 
        .join(" \n ");          

      return next(new ApiError(HttpStatusCode.BadRequest, formattedError));
    }
    next();
  };
};

export default validateRequest;
