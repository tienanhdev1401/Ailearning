import Joi from "joi";

const loginValidation = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "{{#label}} không hợp lệ",
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
  password: Joi.string().required().messages({
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
});

export default loginValidation;
