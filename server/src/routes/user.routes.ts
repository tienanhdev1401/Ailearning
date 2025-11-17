import express from "express";
import UserController from "../controllers/user.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateUserDto } from "../dto/request/CreateUserDTO";
import { UpdateUserDto } from "../dto/request/UpdateUserDTO";
import RoadmapController from "../controllers/roadmap.controller";
import { UserProgressController } from "../controllers/userProgress.controller";
import { RoadmapEnrollmentController } from "../controllers/roadmapEnrollment.controller";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: Quản lý người dùng (CRUD)
 *   - name: Auth
 *     description: Xác thực & Quên mật khẩu (OTP)
 */

// ==================== USER CRUD ====================

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Lấy danh sách tất cả user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách user
 */
router.get(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết 1 user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Thông tin user
 *       404:
 *         description: Không tìm thấy user
 */
router.get(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Tạo mới user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: User được tạo thành công
 */
router.post(
  "/",
  validateDto(CreateUserDto),
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: User được cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 */
router.put(
  "/:id",
  validateDto(UpdateUserDto),
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.updateUser
)


/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Xóa user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của user
 *     responses:
 *       200:
 *         description: User đã bị xóa
 */
router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.deleteUser
);

// ==================== OTP ====================

/**
 * @swagger
 * /api/users/send-verification-code:
 *   post:
 *     summary: Gửi mã OTP xác thực
 *     tags: [User]
 *     responses:
 *       200:
 *         description: OTP đã được gửi
 */
router.post("/send-verification-code", UserController.sendVerificationCode);

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Quên mật khẩu (reset bằng OTP)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi
 */
router.post("/reset-password", UserController.resetPassword);

// Kiểm tra coi tiến trình ngày học trong roadmap của người học
router.get(
  "/:userId/roadmaps/:roadmapId/days",
  RoadmapController.getRoadmapDayStatuses
);

// Kiểm tra user đã enroll roadmap chưa (phục vụ client)
router.get(
  "/:userId/roadmaps/:roadmapId/enrollment",
  RoadmapEnrollmentController.checkEnroll
);

// Lưu tiến trình activity (rời page hoặc Next)
router.put("/:userId/activities/:activityId", UserProgressController.updateProgress);

// Lấy tất cả progress trong day
router.get("/:userId/days/:dayId/progress", UserProgressController.getProgressByDay);

export default router;
