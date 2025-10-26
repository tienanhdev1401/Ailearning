import { AppDataSource } from "../config/database";
import { Activity } from "../models/activity";
import { Day } from "../models/day";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";

export class ActivityService {
  private static activityRepository = AppDataSource.getRepository(Activity);
  private static dayRepository = AppDataSource.getRepository(Day);

  // Tạo mới activity
  static async createActivity(dto: CreateActivityDto): Promise<Activity> {
    // Kiểm tra day có tồn tại
    const day = await this.dayRepository.findOne({ where: { id: dto.dayId } });
    if (!day) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy ngày");

    // Kiểm tra order trùng trong cùng day
    const duplicate = await this.activityRepository.findOne({
      where: { day: { id: dto.dayId }, order: dto.order },
    });
    if (duplicate) {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        `Order ${dto.order} đã tồn tại trong ngày này`
      );
    }

    // Tạo activity mới
    const activity = this.activityRepository.create({
      skill: dto.skill,
      type: dto.type,
      pointOfAc: dto.pointOfAc,
      order: dto.order,
      resources: dto.resources,
      day,
    });

    return await this.activityRepository.save(activity);
  }

  // Lấy danh sách activity theo dayId
  static async getAllByDay(dayId: number): Promise<Activity[]> {
    const day = await this.dayRepository.findOne({ where: { id: dayId } });
    if (!day) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy ngày");

    return await this.activityRepository.find({
      where: { day: { id: dayId } },
      order: { order: "ASC" },
    });
  }

  // Lấy chi tiết activity
  static async getById(id: number): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ["day"],
    });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");
    return activity;
  }

  // Cập nhật activity
  static async updateActivity(id: number, dto: Partial<CreateActivityDto>): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ["day"],
    });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");

    // Kiểm tra order trùng nếu có thay đổi
    if (dto.order && dto.dayId) {
      const day = await this.dayRepository.findOne({ where: { id: dto.dayId } });
      if (!day) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy ngày");

      const duplicate = await this.activityRepository.findOne({
        where: { day: { id: dto.dayId }, order: dto.order },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ApiError(
          HttpStatusCode.BadRequest,
          `Order ${dto.order} đã tồn tại trong ngày này`
        );
      }

      activity.day = day;
    }

    Object.assign(activity, dto);
    return await this.activityRepository.save(activity);
  }

  // Xóa activity
  static async deleteActivity(id: number): Promise<void> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");
    await this.activityRepository.remove(activity);
  }
}
