import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";
import RoadmapRepository from "../repositories/RoadmapRepository.js";

const roadmapRepository = new RoadmapRepository();

class RoadmapService {
  // 🔹 Lấy toàn bộ roadmap
  static async getAllRoadmaps() {
    return await roadmapRepository.findAll();
  }

  // 🔹 Lấy roadmap theo ID
  static async getRoadmapById(id) {
    const roadmap = await roadmapRepository.findById(id);
    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy Roadmap");
    }
    return roadmap;
  }

  // 🔹 Lấy roadmap theo level
  static async getRoadmapByLevel(level) {
    const roadmaps = await roadmapRepository.findByLevel(level);
    if (!roadmaps || roadmaps.length === 0) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy Roadmap cho level này");
    }
    return roadmaps;
  }

  // 🔹 Tạo mới một roadmap
  static async createRoadmap(data) {
    if (!data.level_name || !data.description) {
      throw new ApiError(HttpStatusCode.BadRequest, "Thiếu thông tin level_name hoặc description");
    }
    return await roadmapRepository.create(data);
  }

  // 🔹 Cập nhật roadmap
  static async updateRoadmap(id, updateData) {
    const exists = await roadmapRepository.findById(id);
    if (!exists) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy Roadmap");
    }
    return await roadmapRepository.update(id, updateData);
  }

  // 🔹 Xóa roadmap
  static async deleteRoadmap(id) {
    const exists = await roadmapRepository.findById(id);
    if (!exists) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy Roadmap");
    }
    await roadmapRepository.delete(id);
    return true;
  }
}

export default RoadmapService;
