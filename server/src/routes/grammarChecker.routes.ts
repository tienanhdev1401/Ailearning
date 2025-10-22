// routes/grammarChecker.routes.js
import express from "express";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import validateRequest from "../middlewares/validateRequest.middleware";
import Joi from "joi";
import GrammarCheckerController from "../controllers/grammarChecker.controller";

const router = express.Router();

const generateValidation = Joi.object({
  text: Joi.string().trim().min(1).required().messages({
    "string.empty": "'text' không được để trống",
    "any.required": "'text' là bắt buộc"
  }),
});

router.post(
  "/generate",
  verifyTokenAndRole(),
  validateRequest(generateValidation),
  GrammarCheckerController.generate
);

export default router;
