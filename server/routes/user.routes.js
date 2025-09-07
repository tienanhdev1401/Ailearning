import express from "express";
import UserController from "../controllers/user.controller.js";
import validateRequest from "../middlewares/validateRequest.middleware.js";
import createUserValidation from "../validations/createUserValidation.js";
import updateUserValidation from "../validations/updateUserValidation.js";
import verifyTokenAndRole from "../middlewares/auth.middleware.js";
import USER_ROLE from "../enums/userRole.enum.js";

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
 * api/users/{id}:
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
 * api/users:
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
 *             $ref: '#/components/schemas/CreateUser'
 *     responses:
 *       201:
 *         description: User được tạo thành công
 */
router.post(
  "/",
  validateRequest(createUserValidation),
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
 *             $ref: '#/components/schemas/UpdateUser'
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
  validateRequest(updateUserValidation),
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  UserController.updateUser
)


/**
 * @swagger
 * api/users/{id}:
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
 * api/users/send-verification-code:
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
 * api/users/reset-password:
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

export default router;
