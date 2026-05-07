import { Router } from "express";
import TTSController from "../controllers/tts.controller";

const router = Router();

/**
 * @swagger
 * /api/tts:
 *   get:
 *     summary: Generate TTS audio
 *     tags: [TTS]
 *     parameters:
 *       - in: query
 *         name: text
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: voice
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Audio stream
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/", TTSController.generateTTS);

export default router;
