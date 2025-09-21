import Joi from "joi";
import USER_ROLE from "../enums/userRole.enum.js";
import AUTH_PROVIDER from "../enums/authProvider.enum.js";

const createUserValidation = Joi.object({
    name: Joi.string().required()
    .example("Nguyễn Văn A")
    .messages({
        "string.empty": "{{#label}} không được để trống",
        "any.required": "{{#label}} là bắt buộc",
    }),

    email: Joi.string().email().required()
    .example("newuser@example.com")
    .messages({
        "string.email": "{{#label}} không hợp lệ",
        "string.empty": "{{#label}} không được để trống",
        "any.required": "{{#label}} là bắt buộc",
    }),

    password: Joi.string().min(6).required()
    .example("123456")
    .messages({
        "string.min":   "{{#label}} phải có ít nhất 6 ký tự",
        "string.empty": "{{#label}} không được để trống",
        "any.required": "{{#label}} là bắt buộc",
    }),

    role: Joi.string().required()
    .valid(...Object.values(USER_ROLE))       
    .example(USER_ROLE.USER)
    .messages({
      "any.only": `{{#label}} chỉ có thể là: ${Object.values(USER_ROLE).join(", ")}`,
    }),
    
    authProvider: Joi.string().required()
    .valid(...Object.values(AUTH_PROVIDER)) 
    .example(AUTH_PROVIDER.LOCAL)
    .messages({
        "string.empty": "{{#label}} không được để trống",
        "any.only": `{{#label}} chỉ có thể là: ${Object.values(AUTH_PROVIDER).join(", ")}`,
    }),

});

export default createUserValidation;