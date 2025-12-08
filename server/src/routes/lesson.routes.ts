import express from "express";
import multer from "multer";
import LessonController from "../controllers/lesson.controller";
import attachFileToBody from "../middlewares/attachFile.middleware";
import validateRequest from "../middlewares/validateRequest.middleware";
import createLessonValidation from "../validations/createLessonValidation";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateLessonDto } from "../dto/request/CreateLessonDto";
import { UpdateLessonDto } from "../dto/request/UpdateLessonDto";

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
 *             $ref: '#/components/schemas/CreateLessonDto'
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
  validateDto(CreateLessonDto),              // validate DTO
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
 * /api/lessons/latest-per-type:
 *   get:
 *     summary: Lấy 4 bài học mới nhất cho mỗi topic_type
 *     tags: [Lessons]
 *     description: API trả về danh sách mỗi topic_type kèm theo 4 bài học mới nhất của loại đó.
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       500:
 *         description: Lỗi server
 */
router.get("/latest-per-type", LessonController.getLatestLessonsPerType);

export default router;


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


/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Xóa lesson theo id 
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
 *         description: Xóa thành công lesson
 *       404:
 *         description: Không tìm thấy lesson
 *       500:
 *         description: Lỗi server
 */
// DELETE /lessons/:id -> lấy lesson theo id
router.delete("/:id", LessonController.deleteLesson);


/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Cập nhật lesson theo id
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của lesson
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLessonDto'
 *     responses:
 *       200:
 *         description: Cập nhật lesson thành công
 *       400:
 *         description: Lỗi dữ liệu đầu vào
 *       404:
 *         description: Không tìm thấy lesson
 *       500:
 *         description: Lỗi server
 */
// PUT /lessons/:id -> update lesson (srt_file optional)
router.put(
  "/:id",
  upload.single("srt_file"),
  attachFileToBody("srt_file"),
  validateDto(UpdateLessonDto),
  LessonController.updateLesson
);



