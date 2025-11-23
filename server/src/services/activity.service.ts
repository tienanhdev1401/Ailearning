import { AppDataSource } from "../config/database";
import { In } from "typeorm";
import { Activity } from "../models/activity";
import { Day } from "../models/day";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";
import { UpdateActivityDto } from "../dto/request/UpdateActivityDTO";
import { UpdateManyActivitiesDto } from "../dto/request/UpdateManyActivitiesDTO";


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
      pointOfAc: dto.pointOfAc,
      order: dto.order,
      title: dto.title,
      day,
    });

    return await this.activityRepository.save(activity);
  }

  // Lấy danh sách activity theo dayId
  static async getAllActivityByDayId(
    dayId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{  data:Activity[], total:number, page:number, limit:number}> {
    const day = await this.dayRepository.findOne({ where: { id: dayId } });
    if (!day) 
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy ngày");

    const [data, total] = await this.activityRepository.findAndCount({
      where: { day: { id: dayId } }, 
      order: { order: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // Lấy chi tiết activity
  static async getById(id: number): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ["minigames"],
    });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");
    return activity;
  }

  // Cập nhật activity
  static async updateActivity(id: number, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.getById(id);

    // Nếu đổi order thì kiểm tra không trùng
    if (dto.order !== undefined) {
      const conflict = await this.activityRepository.findOne({
        where: {
          day: { id: activity.day.id },
          order: dto.order,
        },
      });
      if (conflict && conflict.id !== id) {
        throw new ApiError(HttpStatusCode.BadRequest, `Order ${dto.order} đã tồn tại trong ngày này`);
      }
    }

    Object.assign(activity, dto);
    return await this.activityRepository.save(activity);
  }

  static async updateManyActivities(dto: UpdateManyActivitiesDto): Promise<Activity[]> {
    const ids = dto.activities.map(a => a.id);

    // Lấy tất cả activity cần cập nhật
    const existing = await this.activityRepository.find({
      where: { id: In(ids) },
      relations: ["day"], 
    });

    if (existing.length !== dto.activities.length) {
      const existingIds = existing.map(a => a.id);
      const missing = ids.filter(id => !existingIds.includes(id));
      throw new ApiError(
        HttpStatusCode.NotFound,
        `Không tìm thấy activity với id: ${missing.join(", ")}`
      );
    }

    // Cập nhật từng activity
    for (const updateItem of dto.activities) {
      const activity = existing.find(a => a.id === updateItem.id)!;
      Object.assign(activity, updateItem);
    }

    // Kiểm tra trùng order trong cùng day
    const dayId = existing[0].day.id;
    const orders = existing.map(a => a.order);
    const hasDuplicate = orders.length !== new Set(orders).size;
    if (hasDuplicate) {
      throw new ApiError(HttpStatusCode.BadRequest, "Các activity có thứ tự (order) bị trùng.");
    }

    // Lưu tất cả
    return await this.activityRepository.save(existing);
  }


  // Xóa activity
  static async deleteActivity(id: number): Promise<void> {
    const activity = await this.activityRepository.findOne({ where: { id } });
    if (!activity) throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy activity");
    await this.activityRepository.remove(activity);
  }
}
