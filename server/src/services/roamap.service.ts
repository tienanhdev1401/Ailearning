import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { roadmapRepository } from "../repositories/roadmap.repository";
import { Roadmap } from "../models/roadmap";
import { CreateRoadmapDto } from "../dto/request/CreateRoadMapDTO";
import { UpdateRoadmapDto } from "../dto/request/UpdateRoadMapDTO";

export class RoadmapService {
  static async getAllRoadmaps(): Promise<Roadmap[]> {
    return await roadmapRepository.find({
      relations: ["days"],
    });
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
}
