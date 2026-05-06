// routes/translation.routes.ts
import express from "express";
import Joi from "joi";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validateRequest.middleware";
import TranslationController from "../controllers/translation.controller";

const router = express.Router();

// Common NLLB language codes (extend if needed when the model supports more pairs).
const NLLB_LANG_PATTERN = /^[a-z]{3}_[A-Z][a-z]{3}$/;

const translateValidation = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required().messages({
    "string.empty": "'text' không được để trống",
    "any.required": "'text' là bắt buộc",
    "string.max": "'text' tối đa 5000 ký tự",
  }),
  src_lang: Joi.string().pattern(NLLB_LANG_PATTERN).optional(),
  tgt_lang: Joi.string().pattern(NLLB_LANG_PATTERN).optional(),
  num_beams: Joi.number().integer().min(1).max(10).optional(),
});

router.post(
  "/translate",
  verifyTokenAndRole(),
  validateRequest(translateValidation),
  TranslationController.translate
);

export default router;
