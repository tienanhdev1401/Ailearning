// services/lesson.service.js
import fs from "fs";
import SrtParser from "srt-parser-2";
import Lesson from "../models/lesson.js";
import Subtitle from "../models/subtitle.js";
import ApiError from "../utils/ApiError.js";
import { HttpStatusCode } from "axios";
import sequelize from "../config/database.js"; 

import { translateText } from "../helpers/translateHelper.js";
import { phoneticSentence } from "../helpers/phoneticHelper.js";


class LessonService {
    static async createLesson({ title, video_url, thumbnail_url, srtPath }) {
        if (!title || !video_url || !thumbnail_url || !srtPath) {
            throw new ApiError(HttpStatusCode.BadRequest, "Missing required data", "MISSING_DATA");
        }

        const transaction = await sequelize.transaction();

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

        // 3. Tạo subtitles với dịch + phiên âm
        const subtitles = [];
        for (const item of srtArray) {
            // Dịch text
            const translated_text = await translateText(item.text);
            // Phiên âm
            const phonetic_text = await phoneticSentence(item.text);

            subtitles.push({
            lesson_id: lesson.id,
            start_time: item.startTime,
            end_time: item.endTime,
            full_text: item.text,
            translated_text,
            phonetic_text,
            });
        }

        // 4. Lưu subtitles
        await Subtitle.bulkCreate(subtitles, { transaction });

        // 5. Commit transaction
        await transaction.commit();

        // 6. Xóa file tạm
        // fs.unlinkSync(srtPath);

        return { lesson, subtitlesCount: subtitles.length };
        } catch (err) {
        await transaction.rollback();
        // Phân loại lỗi Sequelize
        if (err.name === "SequelizeValidationError") {
            throw new ApiError(HttpStatusCode.BadRequest, "Validation failed", "VALIDATION_ERROR");
        }
        if (err.name === "SequelizeUniqueConstraintError") {
            throw new ApiError(HttpStatusCode.BadRequest, "Duplicate entry", "DUPLICATE_ERROR");
        }
        if (err.name === "SequelizeForeignKeyConstraintError") {
            throw new ApiError(HttpStatusCode.BadRequest, "Invalid foreign key", "FOREIGN_KEY_ERROR");
        }
        throw err;
        } finally {
        // Luôn xóa file tạm sau khi xử lý*
            if (srtPath && fs.existsSync(srtPath)) {
                console.log("Xóa file tạm:", srtPath);
                fs.unlinkSync(srtPath);
            }
        }
    }

    static async getAllLessons() {
        const lessons = await Lesson.findAll({
            include: [{ model: Subtitle, as: "subtitles", order: [["id", "ASC"]] }],
            order: [["id", "ASC"]],
        });

        return lessons.map((lesson) => ({
            lesson: {
            id: lesson.id,
            title: lesson.title,
            video_url: lesson.video_url,
            thumbnail_url: lesson.thumbnail_url,
            subtitles: lesson.subtitles.map((sub) => ({  // <-- dùng lesson.subtitles
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
        const lesson = await Lesson.findOne({
            where: { id },
            include: [{ model: Subtitle, as: "subtitles", order: [["id", "ASC"]] }],
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
            subtitles: lesson.subtitles.map((sub) => ({  // <-- dùng lesson.subtitles
                id: sub.id,
                lesson_id: sub.lesson_id,
                start_time: sub.start_time,
                end_time: sub.end_time,
                full_text: sub.full_text,
                })),
            },
        };
    }
}

export default LessonService;
