import express from "express";
import multer from "multer";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import GopController from "../controllers/gop.controller";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "audio/wav",
      "audio/wave",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp3",
      "audio/webm",
      "audio/ogg",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Định dạng audio không được hỗ trợ"));
    }
  },
});

router.post("/score", verifyTokenAndRole(), upload.single("audio"), GopController.score);

export default router;
