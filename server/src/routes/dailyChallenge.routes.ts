import express from "express";
import { DailyChallengeController } from "../controllers/dailyChallenge.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: DailyChallenge
 *     description: Thử thách hàng ngày trong roadmap
 */

router.get(
  "/status/:roadmapId",
  verifyTokenAndRole(),
  DailyChallengeController.getStatus
);

router.get(
  "/generate/:roadmapId",
  verifyTokenAndRole(),
  DailyChallengeController.generate
);

router.post(
  "/submit/:roadmapId",
  verifyTokenAndRole(),
  DailyChallengeController.submit
);

export default router;
