import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import { userProgressRepository } from "../repositories/userProgress.repository";
import { Roadmap } from "../models/roadmap";
import { CreateRoadmapDto } from "../dto/request/CreateRoadMapDTO";
import { UpdateRoadmapDto } from "../dto/request/UpdateRoadMapDTO";
import { UserProgress } from "../models/userProgress";
import { dayRepository } from "../repositories/day.repository";

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


  // static async getUserRoadmapDayStatuses(
  //   userId: number, 
  //   roadmapId: number,

  // ) {

  //   // ✅ Kiểm tra xem user có enrollment không
  //   const enrollment = await roadmapEnrollementRepository.findOne({
  //     where: {
  //       user: { id: userId },
  //       roadmap: { id: roadmapId },
  //     },
  //   });

  //   if (!enrollment) {
  //     throw new ApiError(HttpStatusCode.Forbidden, "Người dùng chưa enrollment vào roadmap này");
  //   }

  //   // ✅ Lấy roadmap + days + activities
  //   const roadmap = await roadmapRepository.findOne({
  //     where: { id: roadmapId },
  //     relations: ["days", "days.activities"],
  //     order: { days: { dayNumber: "ASC" } },
  //   });

  //   if (!roadmap) {
  //     throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
  //   }

  //   // ✅ Lấy tiến độ của user
  //   const progresses = await userProgressRepository.find({
  //     where: { user: { id: userId } },
  //     relations: ["activity"],
  //   });

  //   const progressMap = new Map<number, UserProgress>();
  //   for (const p of progresses) {
  //     progressMap.set(p.activity.id, p);
  //   }

  //   // ✅ Duyệt qua từng ngày
  //   const dayStatuses = roadmap.days.map((day, index) => {
  //     const activities = day.activities || [];
  //     let status: "locked" | "not_started" | "in_progress" | "completed" = "locked";

  //     if (activities.length === 0) {
  //       status = "not_started";
  //     } else {
  //       let allCompleted = true;
  //       let anyInProgress = false;

  //       for (const act of activities) {
  //         const progress = progressMap.get(act.id);
  //         if (progress) {
  //           if (!progress.isCompleted) {
  //             allCompleted = false;
  //             if (progress.timeSpent && progress.timeSpent > 0) {
  //               anyInProgress = true;
  //             }
  //           }
  //         } else {
  //           allCompleted = false;
  //         }
  //       }

  //       if (allCompleted) status = "completed";
  //       else if (anyInProgress) status = "in_progress";
  //       else status = "not_started";
  //     }

  //     // ✅ Check khóa ngày: ngày hiện tại chỉ mở nếu ngày trước đó đã completed
  //     if (index > 0) {
  //       const prevDayStatus = roadmap.days[index - 1];
  //       const prevActivities = prevDayStatus.activities || [];
  //       const prevCompleted = prevActivities.every((a) => {
  //         const p = progressMap.get(a.id);
  //         return p?.isCompleted;
  //       });
  //       if (!prevCompleted) {
  //         status = "locked";
  //       }
  //     }

  //     return {
  //       dayId: day.id,
  //       dayNumber: day.dayNumber,
  //       theme: day.theme,
  //       description: day.description,
  //       condition: day.condition,
  //       status,
  //     };
  //   });

  //   return {
  //     roadmapId: roadmap.id,
  //     roadmapName: roadmap.levelName,
  //     days: dayStatuses,
  //     total,
  //     page,
  //     limit,
  //   };
  // }
  static async getUserRoadmapDayStatuses(userId: number, roadmapId: number, page = 1, limit = 10) {
  // ✅ Kiểm tra enrollment
    const enrollment = await roadmapEnrollementRepository.findOne({
      where: {
        user: { id: userId },
        roadmap: { id: roadmapId },
      },
    });

    if (!enrollment) {
      throw new ApiError(HttpStatusCode.Forbidden, "Người dùng chưa enrollment vào roadmap này");
    }

    // ✅ Tính offset
    const skip = (page - 1) * limit;

    // ✅ Lấy roadmap + days (có phân trang)
    const [days, total] = await dayRepository.findAndCount({
      where: { roadmap: { id: roadmapId } },
      relations: ["activities"],
      order: { dayNumber: "ASC" },
      skip,
      take: limit,
    });

    if (!days.length) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day nào trong roadmap");
    }

    // ✅ Lấy tiến độ user
    const progresses = await userProgressRepository.find({
      where: { user: { id: userId } },
      relations: ["activity"],
    });

    const progressMap = new Map<number, UserProgress>();
    for (const p of progresses) {
      progressMap.set(p.activity.id, p);
    }

    // ✅ Duyệt qua từng day để tính status
    const dayStatuses = days.map((day, index) => {
      const activities = day.activities || [];
      let status: "locked" | "not_started" | "in_progress" | "completed";

      if (activities.length === 0) {
        status = "not_started";
      } else {
        let allCompleted = true;
        let anyInProgress = false;

        for (const act of activities) {
          const progress = progressMap.get(act.id);
          if (progress) {
            if (!progress.isCompleted) {
              allCompleted = false;
              if (progress.timeSpent && progress.timeSpent > 0) {
                anyInProgress = true;
              }
            }
          } else {
            allCompleted = false;
          }
        }

        if (allCompleted) status = "completed";
        else if (anyInProgress) status = "in_progress";
        else status = "not_started";
      }

      // ✅ Khóa ngày nếu ngày trước chưa hoàn thành
      if (index > 0) {
        const prevDay = days[index - 1];
        const prevCompleted = (prevDay.activities || []).every((a) => {
          const p = progressMap.get(a.id);
          return p?.isCompleted;
        });
        if (!prevCompleted) {
          status = "locked";
        }
      }

      return {
        id: day.id,
        dayNumber: day.dayNumber,
        description: day.description,
        condition: day.condition,
        status,
      };
    });

    // ✅ Trả kết quả phân trang
    return {
      data: dayStatuses,
      total,
      page,
      limit,
    };
  }
}
