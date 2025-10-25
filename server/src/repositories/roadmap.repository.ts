import { AppDataSource } from "../config/database";
import { Roadmap } from "../models/roadmap";

export const roadmapRepository = AppDataSource.getRepository(Roadmap).extend({});
