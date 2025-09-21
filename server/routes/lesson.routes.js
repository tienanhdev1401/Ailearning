import express from "express";
import multer from "multer";
import LessonController from "../controllers/lesson.controller.js";
import attachFileToBody from "../middlewares/attachFile.middleware.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import createLessonValidation from "../validations/createLessonValidation.js";

const router = express.Router();

// Multer setup
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Quản lý Lesson
 */

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Tạo lesson mới với file SRT
 *     tags: [Lessons]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateLesson'
 *     responses:
 *       201:
 *         description: Tạo lesson thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       500:
 *         description: Lỗi server
 */
// POST /lessons -> upload SRT + tạo lesson
router.post(
  "/",
  upload.single("srt_file"),                // multer xử lý upload
  attachFileToBody("srt_file"),             // gắn file vào req.body
  validateRequest(createLessonValidation),  // Joi validate bao gồm file
  LessonController.createLesson
);


/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Lấy tất cả lesson kèm subtitles
 *     tags: [Lessons]
 *     responses:
 *       200:
 *         description: Danh sách lesson
 *       500:
 *         description: Lỗi server
 */
// GET /lessons -> lấy tất cả lessons + subtitles
router.get("/", LessonController.getAllLessons);


/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Lấy lesson theo id 
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lesson
 *     responses:
 *       200:
 *         description: Thông tin lesson
 *       404:
 *         description: Không tìm thấy lesson
 *       500:
 *         description: Lỗi server
 */
// GET /lessons/:id -> lấy lesson theo id
router.get("/:id", LessonController.getLessonById);

export default router;