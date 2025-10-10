// services/lesson.service.js
import fs from "fs";
import SrtParser from "srt-parser-2";
import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";
import prisma from "../config/prisma.js";

class LessonService {
    static async createLesson({ title, video_url, thumbnail_url, srtPath }) {
        if (!title || !video_url || !thumbnail_url || !srtPath) {
            throw new ApiError(HttpStatusCode.BadRequest, "Missing required data", "MISSING_DATA");
        }

        try {
        // 1. Parse SRT trước để fail-fast
        const parser = new SrtParser();
        const srtData = fs.readFileSync(srtPath, "utf-8");
        const srtArray = parser.fromSrt(srtData);

        if (!srtArray.length) {
            throw new ApiError(HttpStatusCode.BadRequest, "Error in parse SRT file");
        }

        const result = await prisma.$transaction(async (tx) => {
            const lesson = await tx.lessons.create({
                data: { title, video_url, thumbnail_url }
            });

            const subtitles = srtArray.map((item) => ({
                lesson_id: lesson.id,
                start_time: item.startTime,
                end_time: item.endTime,
                full_text: item.text,
            }));

            if (subtitles.length) {
                await tx.subtitles.createMany({ data: subtitles });
            }

            return { lesson, subtitlesCount: subtitles.length };
        });

        return result;
        } finally {
        // Luôn xóa file tạm sau khi xử lý*
            if (srtPath && fs.existsSync(srtPath)) {
                console.log("Xóa file tạm:", srtPath);
                fs.unlinkSync(srtPath);
            }
        }
    }

    static async getAllLessons() {
        const lessons = await prisma.lessons.findMany({
            include: { subtitles: { orderBy: { id: 'asc' } } },
            orderBy: { id: 'asc' }
        });

        return lessons.map((lesson) => ({
            lesson: {
            id: lesson.id,
            title: lesson.title,
            video_url: lesson.video_url,
            thumbnail_url: lesson.thumbnail_url,
            subtitles: lesson.subtitles.map((sub) => ({
                id: sub.id,
                lesson_id: sub.lesson_id,
                start_time: sub.start_time,
                end_time: sub.end_time,
                full_text: sub.full_text,
            })),
            },
        }));
    }

    static async getLessonById(id) {
        const lesson = await prisma.lessons.findUnique({
            where: { id: Number(id) },
            include: { subtitles: { orderBy: { id: 'asc' } } }
        });

        if (!lesson) {
            throw new ApiError(HttpStatusCode.NotFound, "Lesson not found", "LESSON_NOT_FOUND");
        }

        return {
            lesson: {
            id: lesson.id,
            title: lesson.title,
            video_url: lesson.video_url,
            thumbnail_url: lesson.thumbnail_url,
            subtitles: lesson.subtitles.map((sub) => ({
                id: sub.id,
                lesson_id: sub.lesson_id,
                start_time: sub.start_time,
                end_time: sub.end_time,
                full_text: sub.full_text,
                })),
            },
        };
    }

    static async deleteLesson(id) {
        await prisma.$transaction(async (tx) => {
            const lesson = await tx.lessons.findUnique({ where: { id: Number(id) } });
            if (!lesson) {
                throw new ApiError(HttpStatusCode.NotFound, "Lesson not found");
            }
            await tx.subtitles.deleteMany({ where: { lesson_id: Number(id) } });
            await tx.lessons.delete({ where: { id: Number(id) } });
        });

        return { message: `Lesson deleted successfully` };
    }
}

export default LessonService;