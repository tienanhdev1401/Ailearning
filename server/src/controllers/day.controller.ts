import { Request, Response, NextFunction } from "express";
import { DayService } from "../services/day.service";
import { plainToInstance } from "class-transformer";
import { CreateDayDto } from "../dto/request/CreateDayDTO";
import { UpdateDayDto } from "../dto/request/UpdateDayDTO";
import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { DayWordImportService } from "../services/dayWordImport.service";

const decodeUploadedFilename = (name: string): string => {
  try {
    return Buffer.from(name, "latin1").toString("utf8");
  } catch {
    return name;
  }
};

class DayController {
  // Thêm ngày vào roadmap
  static async addDayToRoadmap(req: Request, res: Response, next: NextFunction) {
    try {
      const roadmapId = Number(req.params.roadmapId);
      const createDayDto = plainToInstance(CreateDayDto, req.body);

      const newDay = await DayService.addDayToRoadmap(roadmapId, createDayDto);
      res.status(HttpStatusCode.Created).json(newDay);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách tất cả ngày theo roadmap
  static async getAllDaysByRoadmapId(req: Request, res: Response, next: NextFunction) {
    try {
      const roadmapId = Number(req.params.roadmapId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const days = await DayService.getAllDaysByRoadmapId(roadmapId, page, limit);
      res.status(HttpStatusCode.Ok).json(days);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết 1 ngày theo ID
  static async getDayById(req: Request, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.id);
      const day = await DayService.getDayById(dayId);
      res.status(HttpStatusCode.Ok).json(day);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật 1 ngày
  static async updateDay(req: Request, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.id);
      const updateDayDto = plainToInstance(UpdateDayDto, req.body);

      const updatedDay = await DayService.updateDay(dayId, updateDayDto);
      res.status(HttpStatusCode.Ok).json(updatedDay);
    } catch (error) {
      next(error);
    }
  }

  // Xóa 1 ngày
  static async deleteDay(req: Request, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.id);
      await DayService.deleteDay(dayId);
      res.status(HttpStatusCode.Ok).json({ message: "Xóa ngày thành công" });
    } catch (error) {
      next(error);
    }
  }

  static async importWordLesson(req: Request & { file?: Express.Multer.File }, res: Response, next: NextFunction) {
    try {
      const dayId = Number(req.params.id);
      if (!req.file) {
        throw new ApiError(HttpStatusCode.BadRequest, "Vui lòng upload file Word (.docx)");
      }

      const requestedTypes = DayWordImportService.parseRequestedMinigameTypes(req.body.minigameTypes);
      const result = await DayWordImportService.importWordToDay({
        dayId,
        originalFileName: decodeUploadedFilename(req.file.originalname),
        fileBuffer: req.file.buffer,
        minigameTypes: requestedTypes,
        activityTitle: req.body.activityTitle,
      });

      res.status(HttpStatusCode.Created).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default DayController;
