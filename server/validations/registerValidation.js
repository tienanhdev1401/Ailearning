import Joi from "joi";

const registerValidation = Joi.object({
  name: Joi.required().messages({
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
    email: Joi.string().email().required().messages({
    "string.email": "{{#label}} không hợp lệ",
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min":   "{{#label}} phải có ít nhất 6 ký tự",
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
});

export default registerValidation;