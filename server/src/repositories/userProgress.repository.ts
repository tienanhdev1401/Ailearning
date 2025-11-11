import { AppDataSource } from "../config/database";
import { UserProgress } from "../models/userProgress";

export const userProgressRepository = AppDataSource.getRepository(UserProgress).extend({});