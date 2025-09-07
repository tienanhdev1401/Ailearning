import Joi from "joi";

const loginValidation = Joi.object({
  email: Joi.string().email().required()
  .example("user@example.com")
  .messages({
    "string.email": "{{#label}} không hợp lệ",
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
  password: Joi.string().required()
  .example("123456")
  .messages({
    "string.empty": "{{#label}} không được để trống",
    "any.required": "{{#label}} là bắt buộc",
  }),
});

export default loginValidation;
