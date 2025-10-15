import Joi from "joi";

const pronunciationScoreValidation = Joi.object({
  text: Joi.string().trim().min(3).max(1000).required().messages({
    "string.empty": "'text' không được để trống",
    "string.min": "'text' tối thiểu 3 ký tự",
    "string.max": "'text' tối đa 1000 ký tự",
    "any.required": "'text' là bắt buộc"
  }),
  audioUrl: Joi.string().uri({ scheme: ["http", "https"] }).required().messages({
    "string.uri": "'audioUrl' phải là URL hợp lệ (http/https)",
    "any.required": "'audioUrl' là bắt buộc"
  })
});

export default pronunciationScoreValidation;
