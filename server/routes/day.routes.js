import express from "express"
import DayController from "../controllers/day.controller.js"
import verifyTokenAndRole from "../middlewares/auth.middleware.js"
import USER_ROLE from "../enums/userRole.enum.js"

const router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: Day
 *     description: Quản lý ngày học (CRUD)
 */

// ==================== DAY CRUD ====================

/**
 * @swagger
 * /api/days:
 *   get:
 *     summary: Lấy danh sách tất cả days
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách days
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Day'
 */
router.get(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.USER]),
  DayController.getAllDays
)

/**
 * @swagger
 * /api/days/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết 1 day
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của day
 *     responses:
 *       200:
 *         description: Thông tin day
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Day'
 *       404:
 *         description: Không tìm thấy day
 */
router.get(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.USER]),
  DayController.getDayById
)

/**
 * @swagger
 * /api/days/roadmap/{roadmapId}:
 *   get:
 *     summary: Lấy danh sách days theo roadmap ID
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của roadmap
 *     responses:
 *       200:
 *         description: Danh sách days của roadmap
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Day'
 */
router.get(
  "/roadmap/:roadmapId",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.USER]),
  DayController.getDaysByRoadmapId
)

/**
 * @swagger
 * /api/days/roadmap/{roadmapId}/day/{dayNumber}:
 *   get:
 *     summary: Lấy day theo roadmap ID và day number
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roadmapId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của roadmap
 *       - in: path
 *         name: dayNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Số thứ tự của day
 *     responses:
 *       200:
 *         description: Thông tin day
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Day'
 *       404:
 *         description: Không tìm thấy day
 */
router.get(
  "/roadmap/:roadmapId/day/:dayNumber",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF, USER_ROLE.USER]),
  DayController.getDayByNumber
)

/**
 * @swagger
 * /api/days:
 *   post:
 *     summary: Tạo mới day
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roadmap_id
 *               - day_number
 *               - theme
 *               - condition
 *             properties:
 *               roadmap_id:
 *                 type: integer
 *                 description: ID của roadmap
 *               day_number:
 *                 type: integer
 *                 description: Số thứ tự của day
 *               theme:
 *                 type: string
 *                 description: Chủ đề của day
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết
 *               condition:
 *                 type: integer
 *                 description: Điều kiện để hoàn thành day
 *     responses:
 *       201:
 *         description: Day được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Day'
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DayController.createDay
)

/**
 * @swagger
 * /api/days/{id}:
 *   put:
 *     summary: Cập nhật thông tin day
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của day
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_number:
 *                 type: integer
 *                 description: Số thứ tự của day
 *               theme:
 *                 type: string
 *                 description: Chủ đề của day
 *               description:
 *                 type: string
 *                 description: Mô tả chi tiết
 *               condition:
 *                 type: integer
 *                 description: Điều kiện để hoàn thành day
 *     responses:
 *       200:
 *         description: Day được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Day'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy day
 */
router.put(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DayController.updateDay
)

/**
 * @swagger
 * /api/days/{id}:
 *   delete:
 *     summary: Xóa day
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của day
 *     responses:
 *       200:
 *         description: Day đã bị xóa
 *       404:
 *         description: Không tìm thấy day
 */
router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DayController.deleteDay
)

export default router
