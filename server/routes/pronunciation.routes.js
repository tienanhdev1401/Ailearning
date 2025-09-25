// routes/pronunciation.routes.js
import express from "express";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import pronunciationScoreValidation from "../validations/pronunciationScoreValidation.js";
import PronunciationController from "../controllers/pronunciation.controller.js";

const router = express.Router();

// POST /api/pronunciation/score (minimal)
router.post(
  "/score",
  validateRequest(pronunciationScoreValidation),
  PronunciationController.score
);

export default router;
