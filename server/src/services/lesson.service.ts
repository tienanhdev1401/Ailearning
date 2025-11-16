import fs from "fs";
import { AppDataSource } from "../config/database";
import { Lesson } from "../models/lesson";
import { Subtitle } from "../models/subtitle";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { CreateLessonDto } from "../dto/request/CreateLessonDto";
import { parseTimeToSeconds,secondsToMinuteSecond  } from "../utils/time";
import { LessonLevel } from "../enums/lessonLevel.enum";

interface CreateLessonInput extends CreateLessonDto {
  srtPath: string;
}

class LessonService {
  // Tạo lesson mới + parse SRT + lưu subtitles
  static async createLesson(dto: CreateLessonInput) {

    const lessonRepo = AppDataSource.getRepository(Lesson);
    const subtitleRepo = AppDataSource.getRepository(Subtitle);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Tạo lesson
      const lesson = lessonRepo.create(
        { 
          title: dto.title, 
          video_url: dto.video_url, 
          thumbnail_url : dto.thumbnail_url,
          topic_type: dto.topic_type,
          level: dto.level,
        });
      await queryRunner.manager.save(lesson);

      // 2. Parse SRT
      const { default: SrtParser } = await import("srt-parser-2"); 
      const parser = new SrtParser();
      const srtData = fs.readFileSync(dto.srtPath, "utf-8");
      const srtArray = parser.fromSrt(srtData);

      if (!srtArray.length) {
        throw new ApiError(HttpStatusCode.BadRequest, "Error in parse SRT file");
      }

      const subtitles = srtArray.map((item: any) => {
        const sub = subtitleRepo.create({
          lesson: lesson,
          start_time: item.startTime,
          end_time: item.endTime,
          full_text: item.text,
        });
        return sub;
      });

      await queryRunner.manager.save(subtitles);

      await queryRunner.commitTransaction();

      return { lesson, subtitlesCount: subtitles.length };
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
      if (dto.srtPath && fs.existsSync(dto.srtPath)) {
        console.log("Xóa file tạm:", dto.srtPath);
        fs.unlinkSync(dto.srtPath);
      }
    }
  }

  // Lấy tất cả lesson + subtitles
  // static async getAllLessons(): Promise<any[]> {
  //   const lessonRepo = AppDataSource.getRepository(Lesson);
  //   const lessons = await lessonRepo.find({
  //     relations: ["subtitles"],
  //     order: { id: "ASC" },
  //   });

  //   return lessons.map((lesson: Lesson) => ({
  //     lesson: {
  //       id: lesson.id,
  //       title: lesson.title,
  //       video_url: lesson.video_url,
  //       thumbnail_url: lesson.thumbnail_url,
  //       subtitles: (lesson.subtitles || []).map((sub: Subtitle) => ({
  //         id: sub.id,
  //         lesson_id: sub.lesson?.id,
  //         start_time: sub.start_time,
  //         end_time: sub.end_time,
  //         full_text: sub.full_text,
  //       })),
  //     },
  //   }));
  // }

  static async getAllLessons(
    page: number = 1,
    limit: number = 10,
    search?: string,
    topic_type?: string,
    level?: string,
    sort: "latest" | "oldest" | "views" | "least_views" | "longest" | "shortest" = "latest"
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const subtitleRepo = AppDataSource.getRepository(Subtitle);

    let qb = lessonRepo.createQueryBuilder("lesson");

    qb = qb.select([
      "lesson.id",
      "lesson.title",
      "lesson.thumbnail_url",
      "lesson.topic_type",
      "lesson.level",
      "lesson.views",
      "lesson.updatedAt",
    ]);

    // Filters
    if (topic_type) {
      qb = qb.andWhere("lesson.topic_type = :topic_type", { topic_type });
    }

    if (search) {
      qb = qb.andWhere("lesson.title LIKE :search", { search: `%${search}%` });
    }

    if (level) {
      qb = qb.andWhere("lesson.level = :level", { level });
    }

    // Sorting — except longest/shortest (because they require duration)
    if (sort !== "longest" && sort !== "shortest") {
      switch (sort) {
        case "views":
          qb = qb.orderBy("lesson.views", "DESC");
          break;

        case "least_views":
          qb = qb.orderBy("lesson.views", "ASC");
          break;

        case "oldest":
          qb = qb.orderBy("lesson.updatedAt", "ASC");
          break;

        default:
          qb = qb.orderBy("lesson.updatedAt", "DESC"); // latest
          break;
      }
    }

    qb = qb.skip((page - 1) * limit).take(limit);

    const [lessons, total] = await qb.getManyAndCount();

    // Load subtitles để tính duration
    let data = await Promise.all(
      lessons.map(async (lesson) => {
        const subs = await subtitleRepo.find({
          where: { lesson: { id: lesson.id } },
          select: ["start_time", "end_time"],
        });

        let duration = 0;
        if (subs.length) {
          const startTimes = subs.map((s) => parseTimeToSeconds(s.start_time));
          const endTimes = subs.map((s) => parseTimeToSeconds(s.end_time));
          duration = Math.max(...endTimes) - Math.min(...startTimes);
        }

        return {
          id: lesson.id,
          title: lesson.title,
          thumbnail_url: lesson.thumbnail_url,
          topic_type: lesson.topic_type,
          level: lesson.level,
          views: lesson.views,
          duration,
          durationText: secondsToMinuteSecond(duration),
        };
      })
    );

    // Sorting with duration
    if (sort === "longest") {
      data.sort((a, b) => b.duration - a.duration);
    } else if (sort === "shortest") {
      data.sort((a, b) => a.duration - b.duration);
    }

    return { data, total, page, limit };
  }

// Lấy 4 lesson mới nhất của mỗi topic_type
  static async getLatestLessonsPerType() {
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const subtitleRepo = AppDataSource.getRepository(Subtitle);

    // Lấy tất cả topic_type
    const topics = await lessonRepo
      .createQueryBuilder("lesson")
      .select("DISTINCT lesson.topic_type", "topic_type")
      .getRawMany();

    const result: any = {};

    for (const t of topics) {
      const topic = t.topic_type;

      // Lấy 4 lesson mới nhất của mỗi topic  
      const lessons = await lessonRepo.find({
        where: { topic_type: topic },
        select: ["id", "title", "thumbnail_url", "topic_type", "views", "level"],
        order: { id: "DESC" }, // mới nhất
        take: 4,               // lấy đúng 4 cái
      });

      // Tính duration cho từng lesson
      const data = await Promise.all(
        lessons.map(async (lesson) => {
          const subs = await subtitleRepo.find({
            where: { lesson: { id: lesson.id } },
            select: ["start_time", "end_time"],
          });

          let duration = 0;
          if (subs.length) {
            const startTimes = subs.map(s => parseTimeToSeconds(s.start_time));
            const endTimes = subs.map(s => parseTimeToSeconds(s.end_time));
            duration = Math.max(...endTimes) - Math.min(...startTimes);
          }

          return {
            id: lesson.id,
            title: lesson.title,
            thumbnail_url: lesson.thumbnail_url,
            topic_type: lesson.topic_type,
            views: lesson.views,
            level: lesson.level,
            duration: secondsToMinuteSecond(duration),
          };
        })
      );

      result[topic] = data;
    }

    return result;
  }
  // Lấy lesson theo ID
  static async getLessonById(id: number): Promise<any> {
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const lesson = await lessonRepo.findOne({
      where: { id },
      relations: ["subtitles"],
    });

    if (!lesson) {
      throw new ApiError(HttpStatusCode.NotFound, "Lesson not found");
    }

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        video_url: lesson.video_url,
        thumbnail_url: lesson.thumbnail_url,
        subtitles: (lesson.subtitles || []).map((sub: Subtitle) => ({
          id: sub.id,
          lesson_id: sub.lesson?.id,
          start_time: sub.start_time,
          end_time: sub.end_time,
          full_text: sub.full_text,
        })),
      },
    };
  }

  // Xóa lesson + subtitles
  static async deleteLesson(id: number): Promise<{ message: string }> {
    const lessonRepo = AppDataSource.getRepository(Lesson);
    const subtitleRepo = AppDataSource.getRepository(Subtitle);

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lesson = await lessonRepo.findOne({ where: { id } });
      if (!lesson) {
        throw new ApiError(HttpStatusCode.NotFound, "Lesson not found");
      }

      await subtitleRepo.delete({ lesson: { id } });
      await lessonRepo.delete(id);

      await queryRunner.commitTransaction();

      return { message: "Lesson deleted successfully" };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}

export default LessonService;
