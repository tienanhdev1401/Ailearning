import express from "express";
import DayController from "../controllers/day.controller";
import ActivityController from "../controllers/activity.controller";
import validateDto from "../middlewares/validateRequest.middleware";
import { UpdateDayDto } from "../dto/request/UpdateDayDTO";
import verifyTokenAndRole from "../middlewares/auth.middleware";

import USER_ROLE from "../enums/userRole.enum";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Day
 *     description: Quản lý các ngày trong Roadmap
 */


/**
 * @swagger
 * /api/days/{id}:
 *   get:
 *     summary: Lấy chi tiết 1 ngày
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID của ngày
 *     responses:
 *       200:
 *         description: Thông tin chi tiết ngày
 */
router.get(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DayController.getDayById
);

/**
 * @swagger
 * /api/days/{id}:
 *   put:
 *     summary: Cập nhật 1 ngày
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID của ngày
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDayDto'
 *     responses:
 *       200:
 *         description: Ngày được cập nhật thành công
 */
router.put(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(UpdateDayDto),
  DayController.updateDay
);

/**
 * @swagger
 * /api/days/{id}:
 *   delete:
 *     summary: Xóa 1 ngày
 *     tags: [Day]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: number
 *         required: true
 *         description: ID của ngày
 *     responses:
 *       200:
 *         description: Ngày đã bị xóa thành công
 */
router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DayController.deleteDay
);


router.get(
  "/:dayId/activities",
  ActivityController.getAllActivityByDayId
);

export default router;
