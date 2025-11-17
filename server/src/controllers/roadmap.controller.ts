import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { plainToInstance } from "class-transformer";
import { RoadmapService } from "../services/roamap.service";
import ApiError from "../utils/ApiError";
import { CreateRoadmapDto } from "../dto/request/CreateRoadMapDTO";
import { UpdateRoadmapDto } from "../dto/request/UpdateRoadMapDTO";

class RoadmapController {
  // 🔹 Lấy danh sách tất cả Roadmap
  static async getAllRoadmaps(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const roadmaps = await RoadmapService.getAllRoadmaps(page, limit);
      res.status(HttpStatusCode.Ok).json(roadmaps);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Lấy Roadmap theo ID
  static async getRoadmapById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const roadmap = await RoadmapService.getRoadmapById(id);
      res.status(HttpStatusCode.Ok).json(roadmap);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Tạo Roadmap mới
  static async createRoadmap(req: Request, res: Response, next: NextFunction) {
    try {
      const createRoadmapDto = plainToInstance(CreateRoadmapDto, req.body);
      const newRoadmap = await RoadmapService.createRoadmap(createRoadmapDto);
      res.status(HttpStatusCode.Created).json(newRoadmap);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Cập nhật Roadmap
  static async updateRoadmap(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const updateRoadmapDto = plainToInstance(UpdateRoadmapDto, req.body);
      const updatedRoadmap = await RoadmapService.updateRoadmap(id, updateRoadmapDto);
      res.status(HttpStatusCode.Ok).json(updatedRoadmap);
    } catch (error) {
      next(error);
    }
  }

  // 🔹 Xóa Roadmap
  static async deleteRoadmap(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await RoadmapService.deleteRoadmap(id);
      res.status(HttpStatusCode.Ok).json({ message: "Xóa Roadmap thành công" });
    } catch (error) {
      next(error);
    }
  }

  // Kiểm tra coi tiến trình ngày học trong roadmap của người học
  static async getRoadmapDayStatuses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.params.userId);
      const roadmapId = Number(req.params.roadmapId);
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      if (isNaN(userId) || isNaN(roadmapId)) {
        throw new ApiError(HttpStatusCode.BadRequest,"userId hoặc roadmapId không hợp lệ" );
      }
      const result = await RoadmapService.getUserRoadmapDayStatuses(userId, roadmapId, page, limit);
      return res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error)
    }
  }
}

export default RoadmapController;
