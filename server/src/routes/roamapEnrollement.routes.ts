import { Router } from "express";
import { RoadmapEnrollmentController } from "../controllers/roadmapEnrollment.controller";

const router = Router();

// Đăng ký người dùng vào roadmap
router.post("/enroll", RoadmapEnrollmentController.enrollUser);

// Lấy danh sách roadmap mà người dùng đã đăng ký
router.get("/user/:userId", RoadmapEnrollmentController.getUserEnrollments);

// Cập nhật trạng thái học (status) của enrollment
router.put("/:id/status", RoadmapEnrollmentController.updateStatus);

// Xóa đăng ký roadmap
router.delete("/:id", RoadmapEnrollmentController.deleteEnrollment);

export default router;