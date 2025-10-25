// src/routes/roadmap.route.ts
import express from "express";
import RoadmapController from "../controllers/roadmap.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateRoadmapDto } from "../dto/request/CreateRoadMapDTO";
import { UpdateRoadmapDto } from "../dto/request/UpdateRoadMapDTO";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Roadmap
 *     description: Quản lý Roadmap (CRUD)
 */

// ==================== ROADMAP CRUD ====================

/**
 * @swagger
 * /api/roadmaps:
 *   get:
 *     summary: Lấy danh sách tất cả Roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách các Roadmap
 */
router.get(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  RoadmapController.getAllRoadmaps
);

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết 1 Roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của Roadmap
 *     responses:
 *       200:
 *         description: Thông tin Roadmap
 *       404:
 *         description: Không tìm thấy Roadmap
 */
router.get(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  RoadmapController.getRoadmapById
);

/**
 * @swagger
 * /api/roadmaps:
 *   post:
 *     summary: Tạo mới Roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoadmapDto'
 *     responses:
 *       201:
 *         description: Roadmap được tạo thành công
 */
router.post(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(CreateRoadmapDto),
  RoadmapController.createRoadmap
);

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   put:
 *     summary: Cập nhật thông tin Roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của Roadmap
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoadmapDto'
 *     responses:
 *       200:
 *         description: Roadmap được cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy Roadmap
 */
router.put(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(UpdateRoadmapDto),
  RoadmapController.updateRoadmap
);

/**
 * @swagger
 * /api/roadmaps/{id}:
 *   delete:
 *     summary: Xoá Roadmap
 *     tags: [Roadmap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID của Roadmap
 *     responses:
 *       200:
 *         description: Roadmap đã được xoá thành công
 */
router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  RoadmapController.deleteRoadmap
);

export default router;
