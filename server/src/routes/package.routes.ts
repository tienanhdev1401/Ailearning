import express from "express";
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
} from "../controllers/package.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Package
 *     description: Quản lý các gói đăng ký (Subscription Packages)
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: Lấy danh sách các gói đăng ký
 *     tags: [Package]
 */
router.get("/", getAllPackages);

/**
 * @swagger
 * /api/packages/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một gói
 *     tags: [Package]
 */
router.get("/:id", getPackageById);

/**
 * @swagger
 * /api/packages:
 *   post:
 *     summary: Tạo mới gói đăng ký (Chỉ Admin/Staff)
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  createPackage
);

/**
 * @swagger
 * /api/packages/{id}:
 *   put:
 *     summary: Cập nhật thông tin gói đăng ký (Chỉ Admin/Staff)
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  updatePackage
);

/**
 * @swagger
 * /api/packages/{id}:
 *   delete:
 *     summary: Xóa gói đăng ký (Chỉ Admin/Staff)
 *     tags: [Package]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  deletePackage
);

export default router;
