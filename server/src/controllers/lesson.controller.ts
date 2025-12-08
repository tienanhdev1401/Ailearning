import { HttpStatusCode } from "axios";
import LessonService from "../services/lesson.service";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";
import { CreateLessonDto } from "../dto/request/CreateLessonDto";
import { UpdateLessonDto } from "../dto/request/UpdateLessonDto";
import { plainToInstance } from "class-transformer";

class LessonController {
  static async createLesson(req: Request & { file?: any }, res: Response, next: NextFunction) {
    try {
      const createLessonDto = plainToInstance(CreateLessonDto, req.body);
      const file = req.file;

      // For creation, SRT file is required
      if (!file) {
        throw new ApiError(HttpStatusCode.BadRequest, "No SRT file uploaded");
      }

      const result = await LessonService.createLesson({
        ...createLessonDto,
        srtPath: file.path,
      });

      res.status(HttpStatusCode.Created).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAllLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const search = (req.query.search as string) || undefined;
      const topic_type = (req.query.topic_type as string) || undefined;
      const level = (req.query.level as string) || undefined;

      const sort = (req.query.sort as string) as
        | "latest"
        | "oldest"
        | "views"
        | "least_views"
        | "longest"
        | "shortest" || "latest";

      const lessons = await LessonService.getAllLessons(
        page,
        limit,
        search,
        topic_type,
        level,
        sort
      );

      return res.status(HttpStatusCode.Ok).json(lessons);
    } catch (error) {
      next(error);
    }
  }

  static async getLatestLessonsPerType(req: Request, res: Response, next: NextFunction) {
    try {
      const lessons = await LessonService.getLatestLessonsPerType();
      res.status(HttpStatusCode.Ok).json(lessons);
    } catch (error) {
      next(error);
    }
  }


  static async getLessonById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ApiError(HttpStatusCode.BadRequest, "Missing lesson id");
      }
      const lesson = await LessonService.getLessonById(Number(id));
      console.log(lesson);
      res.status(HttpStatusCode.Ok).json(lesson);
    } catch (error) {
      next(error);
    }
  }

  static async deleteLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ApiError(HttpStatusCode.BadRequest, "Missing lesson id");
      }

      const result = await LessonService.deleteLesson(Number(id));
      return res.status(HttpStatusCode.Ok).json({
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLesson(req: Request & { file?: any }, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) {
        throw new ApiError(HttpStatusCode.BadRequest, "Missing lesson id");
      }

      const updateDto = plainToInstance(UpdateLessonDto, req.body);
      const file = req.file;

      const result = await LessonService.updateLesson(Number(id), {
        ...updateDto,
        srtPath: file ? file.path : undefined,
      });

      return res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default LessonController;
