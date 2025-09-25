import { HttpStatusCode } from "axios";
import LessonService from "../services/lesson.service.js";
import ApiError from "../utils/ApiError.js";

class LessonController {
  static async createLesson(req, res, next) {
    try {
      const { title, video_url, thumbnail_url } = req.body;
      const file = req.file;

      if (!file) {
        throw new ApiError(HttpStatusCode.BadRequest, "No SRT file uploaded");
      }

      const result = await LessonService.createLesson({
        title,
        video_url,
        thumbnail_url,
        srtPath: file.path,
      });

      res.status(HttpStatusCode.Created).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getAllLessons(req, res, next) {
    try {
      const lessons = await LessonService.getAllLessons();
      res.status(HttpStatusCode.Ok).json(lessons);
    } catch (error) {
      next(error);
    }
  }

  static async getLessonById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id) {
          throw new ApiError(HttpStatusCode.BadRequest, "Missing lesson id");
      }
      const lesson = await LessonService.getLessonById(id);
      res.status(HttpStatusCode.Ok).json(lesson);
    } catch (error) {
      next(error);
    }
  }

  static async deleteLesson (req, res, next){
    try {
        const { id } = req.params;
        if (!id) {
            throw new ApiError(HttpStatusCode.BadRequest, "Missing lesson id");
        }

        const result = await LessonService.deleteLesson(id);
        return res.status(HttpStatusCode.Ok).json({
            message: result.message,
        });
    } catch (err) {
        next(err); 
    }
  }
}

export default LessonController;
