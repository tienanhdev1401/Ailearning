import express from "express";
import multer from "multer";
import LessonController from "../controllers/lesson.controller.js";
import attachFileToBody from "../middlewares/attachFile.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import createLessonValidation from "../validations/createLessonValidation.js";

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

// POST /lessons -> upload SRT + tạo lesson
router.post(
  "/",
  upload.single("srt_file"),                // multer xử lý upload
  attachFileToBody("srt_file"),             // gắn file vào req.body
  validateRequest(createLessonValidation),  // Joi validate bao gồm file
  LessonController.createLesson
);

// GET /lessons -> lấy tất cả lessons + subtitles
router.get("/", LessonController.getAllLessons);

// GET /lessons/:id -> lấy lesson theo id
router.get("/:id", LessonController.getLessonById);

export default router;