import j2s from "joi-to-swagger";
import loginValidation from "../validations/loginValidation";
import registerValidation from "../validations/registerValidation";
import createUserValidation from "../validations/createUserValidation";
import updateUserValidation from "../validations/updateUserValidation";
import createLessonValidation from "../validations/createLessonValidation";

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
