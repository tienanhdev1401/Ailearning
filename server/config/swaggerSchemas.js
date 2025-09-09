import j2s from "joi-to-swagger";
import loginValidation from "../validations/loginValidation.js";
import registerValidation from "../validations/registerValidation.js";
import createUserValidation from "../validations/createUserValidation.js";
import updateUserValidation from "../validations/updateUserValidation.js";

const { swagger: loginSchema } = j2s(loginValidation);
const { swagger: registerSchema } = j2s(registerValidation);
const { swagger: createUserSchema } = j2s(createUserValidation);
const { swagger: updateUserSchema } = j2s(updateUserValidation);

export const swaggerSchemas = {
  loginSchema,
  registerSchema,
  createUserSchema,
  updateUserSchema
};
