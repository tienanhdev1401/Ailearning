import { HttpStatusCode } from 'axios'
import DayService from '../services/day.service.js'

class DayController {
  // Lấy danh sách tất cả days
  static async getAllDays(req, res, next) {
    try {
      const days = await DayService.getAllDays()
      res.status(HttpStatusCode.Ok).json(days)
    } catch (error) {
      next(error)
    }
  }

  // Lấy day theo ID
  static async getDayById(req, res, next) {
    try {
      const { id } = req.params
      const day = await DayService.getDayById(id)
      res.status(HttpStatusCode.Ok).json(day)
    } catch (error) {
      next(error)
    }
  }

  // Lấy days theo roadmap ID
  static async getDaysByRoadmapId(req, res, next) {
    try {
      const { roadmapId } = req.params
      const days = await DayService.getDaysByRoadmapId(roadmapId)
      res.status(HttpStatusCode.Ok).json(days)
    } catch (error) {
      next(error)
    }
  }

  // Lấy day theo roadmap ID và day number
  static async getDayByNumber(req, res, next) {
    try {
      const { roadmapId, dayNumber } = req.params
      const day = await DayService.getDayByNumber(roadmapId, dayNumber)
      res.status(HttpStatusCode.Ok).json(day)
    } catch (error) {
      next(error)
    }
  }

  // Tạo day mới
  static async createDay(req, res, next) {
    try {
      const newDay = await DayService.createDay(req.body)
      res.status(HttpStatusCode.Created).json(newDay)
    } catch (error) {
      next(error)
    }
  }

  // Cập nhật day
  static async updateDay(req, res, next) {
    try {
      const { id } = req.params
      const updatedDay = await DayService.updateDay(id, req.body)
      res.status(HttpStatusCode.Ok).json(updatedDay)
    } catch (error) {
      next(error)
    }
  }

  // Xóa day
  static async deleteDay(req, res, next) {
    try {
      const { id } = req.params
      await DayService.deleteDay(id)
      res.status(HttpStatusCode.Ok).json({ message: "Xóa day thành công" })
    } catch (error) {
      next(error)
    }
  }
}

export default DayController
