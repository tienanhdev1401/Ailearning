import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import { userProgressRepository } from "../repositories/userProgress.repository";
import { Roadmap } from "../models/roadmap";
import { CreateRoadmapDto } from "../dto/request/CreateRoadMapDTO";
import { UpdateRoadmapDto } from "../dto/request/UpdateRoadMapDTO";
import { dayRepository } from "../repositories/day.repository";
import { AppDataSource } from "../config/database";
import { UserSubscription } from "../models/userSubscription";
import { PACKAGE_TYPE } from "../enums/packageType.enum";
import { IsNull, MoreThan } from "typeorm";
import {
  buildProgressMap,
  getDayProgressStatus,
  isDayEverCompleted,
} from "../utils/roadmapProgress.helper";

export class RoadmapService {
  static async getAllRoadmaps(
    page: number = 1,
    limit: number = 10
  ):
    Promise<{ data: Roadmap[]; total: number; page: number; limit: number }> {
    const [data, total] = await roadmapRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: "ASC" }, // sắp xếp theo id
    });
    return { data, total, page, limit };
  }

  static async getRoadmapById(id: number): Promise<Roadmap> {
    const roadmap = await roadmapRepository.findOne({
      where: { id },
      relations: ["days"],
    });

    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy Roadmap");
    }
    return roadmap;
  }

  static async createRoadmap(createRoadmapDto: CreateRoadmapDto): Promise<Roadmap> {
    const newRoadmap = roadmapRepository.create({
      levelName: createRoadmapDto.levelName,
      description: createRoadmapDto.description || null,
      overview: createRoadmapDto.overview || null,
      freeDayCount: createRoadmapDto.freeDayCount ?? -1,
    });

    return await roadmapRepository.save(newRoadmap);
  }

  static async updateRoadmap(id: number, updateRoadmapDto: UpdateRoadmapDto): Promise<Roadmap> {
    const roadmap = await this.getRoadmapById(id);
    roadmapRepository.merge(roadmap, updateRoadmapDto);
    return await roadmapRepository.save(roadmap);
  }

  static async deleteRoadmap(id: number): Promise<boolean> {
    const roadmap = await this.getRoadmapById(id);
    await roadmapRepository.remove(roadmap);
    return true;
  }

  static async getUserRoadmapDayStatuses(userId: number, roadmapId: number, page = 1, limit = 10) {
    const userSubscriptionRepo = AppDataSource.getRepository(UserSubscription);
    const now = new Date();
    const skip = (page - 1) * limit;

    const [enrollment, subscription, roadmap, daysAndTotal, progresses, prevPageLastDays] =
      await Promise.all([
        roadmapEnrollementRepository.findOne({
          where: {
            user: { id: userId },
            roadmap: { id: roadmapId },
          },
        }),
        userSubscriptionRepo.findOne({
          where: [
            {
              userId,
              isActive: true,
              package: { type: PACKAGE_TYPE.ROADMAP_UNLOCK, targetId: roadmapId },
              endDate: MoreThan(now)
            },
            {
              userId,
              isActive: true,
              package: { type: PACKAGE_TYPE.ROADMAP_UNLOCK, targetId: roadmapId },
              endDate: IsNull()
            }
          ],
          relations: ["package"]
        }),
        roadmapRepository.findOne({ where: { id: roadmapId } }),
        dayRepository.findAndCount({
          where: { roadmap: { id: roadmapId } },
          relations: ["activities"],
          order: { dayNumber: "ASC" },
          skip,
          take: limit,
        }),
        userProgressRepository.find({
          where: { user: { id: userId }, activity: { day: { roadmap: { id: roadmapId } } } },
          relations: ["activity"],
        }),
        skip > 0
          ? dayRepository.find({
            where: { roadmap: { id: roadmapId } },
            relations: ["activities"],
            order: { dayNumber: "ASC" },
            skip: skip - 1,
            take: 1,
          })
          : Promise.resolve([]),
      ]);

    if (!enrollment) {
      throw new ApiError(HttpStatusCode.Forbidden, "Người dùng chưa enrollment vào roadmap này");
    }

    const isSubscribed = !!subscription;
    const freeDayCount = roadmap?.freeDayCount || 0;
    const [days, total] = daysAndTotal;

    if (!days.length) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day nào trong roadmap");
    }

    const progressMap = buildProgressMap(progresses);
    const prevPageLastDay = prevPageLastDays[0] ?? null;

    const dayStatuses = days.map((day, index) => {
      let status: "locked" | "not_started" | "in_progress" | "completed" | "vip_required" =
        getDayProgressStatus(day, progressMap);

      const prevDay = index > 0 ? days[index - 1] : prevPageLastDay;
      if (prevDay && !isDayEverCompleted(prevDay, progressMap)) {
        status = "locked";
      }

      if (!isSubscribed && freeDayCount !== -1 && day.dayNumber > freeDayCount) {
        status = "vip_required";
      }

      return {
        id: day.id,
        dayNumber: day.dayNumber,
        description: day.description,
        condition: day.condition,
        status,
      };
    });

    return {
      data: dayStatuses,
      total,
      page,
      limit,
    };
  }
}
