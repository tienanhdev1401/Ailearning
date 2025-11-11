import { AppDataSource } from "../config/database";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";
import { User } from "../models/user";
import { Roadmap } from "../models/roadmap";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { userRepository } from "../repositories/user.repository";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import ENROLLMENT_STATUS from "../enums/enrollmentStatus.enum";

export class RoadmapEnrollmentService {

  // Đăng ký người dùng vào 1 roadmap
  static async enrollUserToRoadmap(userId: number, roadmapId: number): Promise<RoadmapEnrollment> {
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy người dùng");
    }

    const roadmap = await roadmapRepository.findOne({ where: { id: roadmapId } });
    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const existingEnrollment = await roadmapEnrollementRepository.findOne({
      where: { user: { id: userId }, roadmap: { id: roadmapId } },
    });

    if (existingEnrollment) {
      throw new ApiError(HttpStatusCode.BadRequest, "Người dùng đã tham gia đăng ký roadmap này rồi");
    }

    const enrollment = roadmapEnrollementRepository.create({
      user,
      roadmap,
      status: "active",
      started_at: new Date(),
    });

    return await roadmapEnrollementRepository.save(enrollment);
  }

  // Lấy danh sách roadmap mà 1 user đã tham gia
  static async getEnrollmentsByUser(userId: number): Promise<RoadmapEnrollment[]> {
    return await roadmapEnrollementRepository.find({
      where: { user: { id: userId } },
      relations: ["roadmap"],
      order: { started_at: "DESC" },
    });
  }

  // Cập nhật trạng thái tham gia (pause, resume, complete, drop)
  static async updateStatus(enrollmentId: number, status: ENROLLMENT_STATUS) {

    // Kiem tra status co nam trong enum khong
    if (!Object.values(ENROLLMENT_STATUS).includes(status))
      throw new ApiError(HttpStatusCode.BadRequest, "Trạng thái không hợp lệ");
    
    const enrollment = await roadmapEnrollementRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy bản ghi đăng ký");
    }

    enrollment.status = status;
    return await roadmapEnrollementRepository.save(enrollment);
  }

  // Xóa việc tham gia roadmap
  static async removeEnrollment(enrollmentId: number) {
    const enrollment = await roadmapEnrollementRepository.findOne({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy bản ghi đăng ký");
    }

    await roadmapEnrollementRepository.remove(enrollment);
    return { message: "Xóa đăng ký thành công" };
  }
}
