import j2s from "joi-to-swagger";
import loginValidation from "../validations/loginValidation.js";
import registerValidation from "../validations/registerValidation.js";
import createUserValidation from "../validations/createUserValidation.js";
import updateUserValidation from "../validations/updateUserValidation.js";
import createLessonValidation from "../validations/createLessonValidation.js";

const { swagger: loginSchema } = j2s(loginValidation);
const { swagger: registerSchema } = j2s(registerValidation);
const { swagger: createUserSchema } = j2s(createUserValidation);
const { swagger: updateUserSchema } = j2s(updateUserValidation);

const { swagger: createLessonSchema } = j2s(createLessonValidation);
createLessonSchema.properties.srt_file = {
  type: "string",
  format: "binary",
  description: "File SRT của bài học"
};


export const swaggerSchemas = {
  loginSchema,
  registerSchema,
  createUserSchema,
  updateUserSchema,
  createLessonSchema,
};
