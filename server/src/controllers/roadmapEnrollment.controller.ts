import { Request, Response } from "express";
import { RoadmapEnrollmentService } from "../services/roadmapEnrollment.service";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";
import { roadmapEnrollementRepository } from "../repositories/roadmapEnrollement.repository";
import { NextFunction } from "http-proxy-middleware/dist/types";

export class RoadmapEnrollmentController {

  static async enrollUser(req: Request, res: Response) {
    try {
      const { userId, roadmapId } = req.body;
      const enrollment = await RoadmapEnrollmentService.enrollUserToRoadmap(userId, roadmapId);
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }


  static async getUserEnrollments(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const enrollments = await RoadmapEnrollmentService.getEnrollmentsByUser(Number(userId));
      res.json(enrollments);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await RoadmapEnrollmentService.updateStatus(Number(id), status);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEnrollment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await RoadmapEnrollmentService.removeEnrollment(Number(id));
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ message: error.message });
    }
  }
  static async checkEnroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, roadmapId } = req.params;
      const result = await RoadmapEnrollmentService.checkEnroll(Number(userId), Number(roadmapId));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveEnrollment(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await RoadmapEnrollmentService.getActiveEnrollment(Number(userId));
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async selectRoadmap(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { roadmapId, restart } = req.body;
      const result = await RoadmapEnrollmentService.setActiveRoadmap(Number(userId), Number(roadmapId), {
        restart: Boolean(restart),
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
