import { AppDataSource } from "../config/database";
import { RoadmapEnrollment } from "../models/roadmapEnrollment";

export const roadmapEnrollementRepository = AppDataSource.getRepository(RoadmapEnrollment).extend({});
