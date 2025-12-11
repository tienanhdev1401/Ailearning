import { AppDataSource } from "../config/database";
import { RoadmapReview } from "../models/roadmapReview";

export const roadmapReviewRepository = AppDataSource.getRepository(RoadmapReview).extend({});
