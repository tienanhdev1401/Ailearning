import { AppDataSource } from "../config/database";
import { Day } from "../models/day";
import { Roadmap } from "../models/roadmap";
import { CreateDayDto } from "../dto/request/CreateDayDTO";
import { UpdateDayDto } from "../dto/request/UpdateDayDTO";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

export class DayService {
  private static dayRepository = AppDataSource.getRepository(Day);
  private static roadmapRepository = AppDataSource.getRepository(Roadmap);

  // Thêm ngày vào roadmap
  static async addDayToRoadmap(roadmapId: number, createDayDto: CreateDayDto): Promise<Day> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id: roadmapId } });

    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    // ✅ Kiểm tra dayNumber đã tồn tại trong roadmap chưa
    const existingDay = await this.dayRepository.findOne({
      where: { roadmap: { id: roadmapId }, dayNumber: createDayDto.dayNumber },
    });

    if (existingDay) {
      throw new ApiError(HttpStatusCode.BadRequest, `Ngày số ${createDayDto.dayNumber} đã tồn tại trong roadmap này`);
    }

    const newDay = this.dayRepository.create({
      dayNumber: createDayDto.dayNumber,
      description: createDayDto.description,
      condition: createDayDto.condition,
      roadmap,
    });

    return await this.dayRepository.save(newDay);
  }

  // Lấy danh sách tất cả ngày thuộc 1 roadmap
  static async getAllDaysByRoadmapId(
    roadmapId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Day[]; total: number; page: number; limit: number }> {
    const roadmap = await this.roadmapRepository.findOne({ where: { id: roadmapId } });

    if (!roadmap) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy roadmap");
    }

    const [data, total] = await this.dayRepository.findAndCount({
    where: { roadmap: { id: roadmapId } },
      order: { dayNumber: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  // Lấy chi tiết 1 ngày theo ID
  static async getDayById(id: number): Promise<Day> {
    const day = await this.dayRepository.findOne({
      where: { id },
      relations: ["activities"],
    });

    if (!day) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy ngày");
    }
    return day;
  }

  // Cập nhật 1 ngày trong roadmap
  static async updateDay(id: number, updateDayDto: UpdateDayDto): Promise<Day> {
    const day = await this.getDayById(id);

    // ✅ Nếu người dùng cập nhật dayNumber, kiểm tra trùng trong cùng roadmap
    if (updateDayDto.dayNumber && updateDayDto.dayNumber !== day.dayNumber) {
      const duplicateDay = await this.dayRepository.findOne({
        where: { roadmap: { id: day.roadmap.id }, dayNumber: updateDayDto.dayNumber },
      });

      if (duplicateDay) {
        throw new ApiError(
          HttpStatusCode.BadRequest,
          `Ngày số ${updateDayDto.dayNumber} đã tồn tại trong roadmap này`
        );
      }
    }

    this.dayRepository.merge(day, updateDayDto);
    return await this.dayRepository.save(day);
  }

  // Xóa 1 ngày khỏi roadmap
  static async deleteDay(id: number): Promise<boolean> {
    const day = await this.getDayById(id);
    await this.dayRepository.remove(day);
    return true;
  }
}
