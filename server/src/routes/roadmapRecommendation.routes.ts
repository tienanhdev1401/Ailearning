import { Router } from "express";
import { RoadmapRecommendationController } from "../controllers/roadmapRecommendation.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: RoadmapRecommendation
 *     description: AI-powered roadmap recommendation based on user multicheck data
 */

/**
 * @swagger
 * /api/roadmap-recommendation:
 *   get:
 *     summary: Lấy lộ trình được AI đề xuất cho user hiện tại
 *     tags: [RoadmapRecommendation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kết quả đề xuất lộ trình
 *       400:
 *         description: User chưa hoàn thành multicheck
 *       401:
 *         description: Chưa đăng nhập
 */
router.get(
  "/",
  verifyTokenAndRole(),
  RoadmapRecommendationController.getRecommendation
);

export default router;
