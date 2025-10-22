// routes/pronunciation.routes.js
import express from "express";
import validateRequest from "../middlewares/validateRequest.middleware";
import pronunciationScoreValidation from "../validations/pronunciationScoreValidation";
import PronunciationController from "../controllers/pronunciation.controller";

const router = express.Router();

// POST /api/pronunciation/score (minimal)
router.post(
  "/score",
  validateRequest(pronunciationScoreValidation),
  PronunciationController.score
);

export default router;
