import fs from "fs";
import { Transaction } from "sequelize";
import SrtParser from "srt-parser-2";
import Lesson from "../models/lesson";
import Subtitle from "../models/subtitle";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import sequelize from "../config/database";

interface CreateLessonInput {
  title: string;
  video_url: string;
  thumbnail_url: string;
  srtPath: string;
}

class LessonService {
  // 🟢 Tạo lesson mới + parse SRT + lưu subtitles
  static async createLesson({
    title,
    video_url,
    thumbnail_url,
    srtPath,
  }: CreateLessonInput) {
    if (!title || !video_url || !thumbnail_url || !srtPath) {
      throw new ApiError(HttpStatusCode.BadRequest, "Missing required data");
    }

    const transaction: Transaction = await sequelize.transaction();

    try {
      // 1. Tạo lesson
      const lesson = await Lesson.create(
        { title, video_url, thumbnail_url },
        { transaction }
      );

      // 2. Parse SRT
      const parser = new SrtParser();
      const srtData = fs.readFileSync(srtPath, "utf-8");
      const srtArray = parser.fromSrt(srtData);

      if (!srtArray.length) {
        throw new ApiError(HttpStatusCode.BadRequest, "Error in parse SRT file");
      }

      // Lấy id từ lesson.get("id") hoặc lesson["id"]
      const lessonId = (lesson as any).id ?? lesson.get?.("id");

      const subtitles = srtArray.map((item: any) => ({
        lesson_id: lessonId,
        start_time: item.startTime,
        end_time: item.endTime,
        full_text: item.text,
      }));

      // 3. Lưu subtitles
      await Subtitle.bulkCreate(subtitles, { transaction });

      // 4. Commit transaction
      await transaction.commit();

      return { lesson, subtitlesCount: subtitles.length };
    } catch (err: any) {
      await transaction.rollback();

      // Phân loại lỗi Sequelize
      if (err.name === "SequelizeValidationError") {
        throw new ApiError(HttpStatusCode.BadRequest, "Validation failed");
      }
      if (err.name === "SequelizeUniqueConstraintError") {
        throw new ApiError(HttpStatusCode.BadRequest, "Duplicate entry");
      }
      if (err.name === "SequelizeForeignKeyConstraintError") {
        throw new ApiError(HttpStatusCode.BadRequest, "Invalid foreign key");
      }
      throw err;
    } finally {
      // Luôn xóa file tạm sau khi xử lý
      if (srtPath && fs.existsSync(srtPath)) {
        console.log("Xóa file tạm:", srtPath);
        fs.unlinkSync(srtPath);
      }
    }
  }

  // 🟢 Lấy tất cả lesson + subtitles
  static async getAllLessons(): Promise<any[]> {
    const lessons = await Lesson.findAll({
      include: [{ model: Subtitle, as: "subtitles", order: [["id", "ASC"]] }],
      order: [["id", "ASC"]],
    });

    return lessons.map((lesson: any) => {
      const lessonSubtitles = (lesson as any).subtitles ?? lesson.get?.("subtitles") ?? [];
      return {
        lesson: {
          id: (lesson as any).id ?? lesson.get?.("id"),
          title: (lesson as any).title ?? lesson.get?.("title"),
          video_url: (lesson as any).video_url ?? lesson.get?.("video_url"),
          thumbnail_url: (lesson as any).thumbnail_url ?? lesson.get?.("thumbnail_url"),
          subtitles: lessonSubtitles.map((sub: any) => ({
            id: (sub as any).id ?? sub.get?.("id"),
            lesson_id: sub.lesson_id,
            start_time: sub.start_time,
            end_time: sub.end_time,
            full_text: sub.full_text,
          })),
        },
      };
    });
  }

  // 🟢 Lấy lesson theo ID
  static async getLessonById(id: number): Promise<any> {
    const lesson = await Lesson.findOne({
      where: { id },
      include: [{ model: Subtitle, as: "subtitles", order: [["id", "ASC"]] }],
    });

    if (!lesson) {
      throw new ApiError(HttpStatusCode.NotFound, "Lesson not found");
    }

    const lessonSubtitles = (lesson as any).subtitles ?? lesson.get?.("subtitles") ?? [];
    return {
      lesson: {
        id: (lesson as any).id ?? lesson.get?.("id"),
        title: (lesson as any).title ?? lesson.get?.("title"),
        video_url: (lesson as any).video_url ?? lesson.get?.("video_url"),
        thumbnail_url: (lesson as any).thumbnail_url ?? lesson.get?.("thumbnail_url"),
        subtitles: lessonSubtitles.map((sub: any) => ({
          id: (sub as any).id ?? sub.get?.("id"),
          lesson_id: sub.lesson_id,
          start_time: sub.start_time,
          end_time: sub.end_time,
          full_text: sub.full_text,
        })),
      },
    };
  }

  // 🟢 Xóa lesson + subtitles
  static async deleteLesson(id: number): Promise<{ message: string }> {
    const transaction: Transaction = await sequelize.transaction();
    try {
      // Kiểm tra lesson tồn tại
      const lesson = await Lesson.findByPk(id, { transaction });
      if (!lesson) {
        throw new ApiError(HttpStatusCode.NotFound, "Lesson not found");
      }

      // Xóa subtitles trước
      await Subtitle.destroy({ where: { lesson_id: id }, transaction });

      // Xóa lesson
      await Lesson.destroy({ where: { id }, transaction });

      // Commit transaction
      await transaction.commit();

      return { message: "Lesson deleted successfully" };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

export default LessonService;
