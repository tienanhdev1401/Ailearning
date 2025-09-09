// validations/updateUserValidation.js
import Joi from "joi";
import USER_ROLE from "../enums/userRole.enum.js";
import AUTH_PROVIDER from "../enums/authProvider.enum.js";

const updateUserValidation = Joi.object({
  name: Joi.string()
    .optional()
    .example("Nguyễn Văn B")
    .messages({
      "string.empty": "{{#label}} không được để trống",
    }),

  email: Joi.string()
    .email()
    .optional()
    .example("updateduser@example.com")
    .messages({
      "string.email": "{{#label}} không hợp lệ",
    }),

  password: Joi.string()
    .min(6)
    .optional()
    .example("newpassword123")
    .messages({
      "string.min": "{{#label}} phải có ít nhất 6 ký tự",
    }),

  role: Joi.string()
    .valid(...Object.values(USER_ROLE))
    .optional()
    .example(USER_ROLE.STAFF)
    .messages({
      "any.only": `{{#label}} chỉ có thể là: ${Object.values(USER_ROLE).join(", ")}`,
    }),

  authProvider: Joi.string()
    .valid(...Object.values(AUTH_PROVIDER))
    .optional()
    .example(AUTH_PROVIDER.LOCAL)
    .messages({
      "any.only": `{{#label}} chỉ có thể là: ${Object.values(AUTH_PROVIDER).join(", ")}`,
    }),
});

export default updateUserValidation;
