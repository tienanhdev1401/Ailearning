import { Router } from "express";
import multer from "multer";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import {
  listScenarios,
  createScenario,
  startSession,
  listSessions,
  postTextMessage,
  postAudioMessage,
  getSessionHistory,
  completeSession,
  getEvaluation,
  synthesizeSpeech,
} from "../controllers/aiChat.controller";

const router = Router();
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB safety cap per turn
});

router.get("/scenarios", verifyTokenAndRole(), listScenarios);
router.post("/scenarios", verifyTokenAndRole(), createScenario);

router.post("/sessions", verifyTokenAndRole(), startSession);
router.get("/sessions", verifyTokenAndRole(), listSessions);
router.get("/sessions/:id/history", verifyTokenAndRole(), getSessionHistory);
router.post("/sessions/:id/messages", verifyTokenAndRole(), postTextMessage);
router.post(
  "/sessions/:id/audio",
  verifyTokenAndRole(),
  audioUpload.single("audio"),
  postAudioMessage
);
router.post("/sessions/:id/complete", verifyTokenAndRole(), completeSession);
router.get("/sessions/:id/evaluation", verifyTokenAndRole(), getEvaluation);
router.post("/speech", verifyTokenAndRole(), synthesizeSpeech);

export default router;
