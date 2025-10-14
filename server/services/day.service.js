import ApiError from "../utils/ApiError.js"
import { HttpStatusCode } from "axios"
import DayRepository from "../repositories/DayRepository.js"

const dayRepository = new DayRepository()

class DayService {
  // Lấy danh sách tất cả days
  static async getAllDays() {
    return await dayRepository.findAll()
  }

  // Lấy day theo ID
  static async getDayById(id) {
    const day = await dayRepository.findById(Number(id))
    if (!day) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day")
    }
    return day
  }

  // Lấy days theo roadmap ID
  static async getDaysByRoadmapId(roadmapId) {
    return await dayRepository.findByRoadmapId(roadmapId)
  }

  // Lấy day theo roadmap ID và day number
  static async getDayByNumber(roadmapId, dayNumber) {
    const day = await dayRepository.findByDayNumber(roadmapId, dayNumber)
    if (!day) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day")
    }
    return day
  }

  // Tạo day mới
  static async createDay(dayData) {
    const { roadmap_id, day_number, theme, description, condition } = dayData

    // Business logic: Kiểm tra day_number đã tồn tại trong roadmap chưa
    const existingDay = await dayRepository.findByDayNumber(roadmap_id, day_number)
    if (existingDay) {
      throw new ApiError(HttpStatusCode.BadRequest, "Day number đã tồn tại trong roadmap này")
    }

    // Business logic: Validate dữ liệu
    if (!roadmap_id || !day_number || !theme || condition === undefined) {
      throw new ApiError(HttpStatusCode.BadRequest, "Thiếu thông tin bắt buộc")
    }

    if (day_number < 1) {
      throw new ApiError(HttpStatusCode.BadRequest, "Day number phải lớn hơn 0")
    }

    return await dayRepository.create({
      roadmap_id: Number(roadmap_id),
      day_number: Number(day_number),
      theme,
      description,
      condition: Number(condition)
    })
  }

  // Cập nhật day
  static async updateDay(id, updateData) {
    const { day_number, theme, description, condition } = updateData

    // Kiểm tra day có tồn tại không
    const existingDay = await dayRepository.findById(Number(id))
    if (!existingDay) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day")
    }

    // Business logic: Nếu cập nhật day_number, kiểm tra trùng lặp
    if (day_number && day_number !== existingDay.day_number) {
      const duplicateDay = await dayRepository.findByDayNumber(existingDay.roadmap_id, day_number)
      if (duplicateDay) {
        throw new ApiError(HttpStatusCode.BadRequest, "Day number đã tồn tại trong roadmap này")
      }
    }

    // Business logic: Validate dữ liệu
    if (day_number && day_number < 1) {
      throw new ApiError(HttpStatusCode.BadRequest, "Day number phải lớn hơn 0")
    }

    const updatePayload = {}
    if (day_number !== undefined) updatePayload.day_number = Number(day_number)
    if (theme !== undefined) updatePayload.theme = theme
    if (description !== undefined) updatePayload.description = description
    if (condition !== undefined) updatePayload.condition = Number(condition)

    return await dayRepository.update(Number(id), updatePayload)
  }

  // Xóa day
  static async deleteDay(id) {
    // Kiểm tra day có tồn tại không
    const existingDay = await dayRepository.findById(Number(id))
    if (!existingDay) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day")
    }

    // Business logic: Kiểm tra day có activities không
    if (existingDay.activities && existingDay.activities.length > 0) {
      throw new ApiError(HttpStatusCode.BadRequest, "Không thể xóa day có activities")
    }

    await dayRepository.delete(Number(id))
    return true
  }
}

export default DayService
