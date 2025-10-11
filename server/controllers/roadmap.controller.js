import { HttpStatusCode } from "axios";
import RoadmapService from "../services/roadmap.service.js";

class RoadmapController {
  // 🔹 Lấy tất cả roadmaps
  static async getAll(req, res, next) {
    try {
      const roadmaps = await RoadmapService.getAllRoadmaps();
      res.status(HttpStatusCode.Ok).json(roadmaps);
    } catch (err) {
      next(err);
    }
  }

  // 🔹 Lấy roadmap theo ID
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const roadmap = await RoadmapService.getRoadmapById(id);
      res.status(HttpStatusCode.Ok).json(roadmap);
    } catch (err) {
      next(err);
    }
  }

  // 🔹 Lấy roadmap theo level
  static async getByLevel(req, res, next) {
    try {
      const { level } = req.params;
      const roadmaps = await RoadmapService.getRoadmapByLevel(level);
      res.status(HttpStatusCode.Ok).json(roadmaps);
    } catch (err) {
      next(err);
    }
  }

  // 🔹 Tạo roadmap mới
  static async create(req, res, next) {
    try {
      const roadmap = await RoadmapService.createRoadmap(req.body);
      res.status(HttpStatusCode.Created).json(roadmap);
    } catch (err) {
      next(err);
    }
  }

  // 🔹 Cập nhật roadmap
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await RoadmapService.updateRoadmap(id, req.body);
      res.status(HttpStatusCode.Ok).json(updated);
    } catch (err) {
      next(err);
    }
  }

  // 🔹 Xóa roadmap
  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      await RoadmapService.deleteRoadmap(id);
      res.json({ message: "Xóa Roadmap thành công" });
    } catch (err) {
      next(err);
    }
  }
}

export default RoadmapController;
