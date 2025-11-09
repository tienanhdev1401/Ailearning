import { Router } from "express";
import multer from "multer";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import {
  listScenarios,
  createScenario,
  startSession,
  postTextMessage,
  postAudioMessage,
  getSessionHistory,
  completeSession,
  getEvaluation,
  downloadAudioArchive,
  synthesizeSpeech,
} from "../controllers/aiChat.controller";

const router = Router();
const audioUpload = multer({ dest: "uploads/ai-chat/tmp" });

router.get("/scenarios", verifyTokenAndRole(), listScenarios);
router.post("/scenarios", verifyTokenAndRole(), createScenario);

router.post("/sessions", verifyTokenAndRole(), startSession);
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
router.get("/sessions/:id/audio-archive", verifyTokenAndRole(), downloadAudioArchive);
router.post("/speech", verifyTokenAndRole(), synthesizeSpeech);

export default router;
