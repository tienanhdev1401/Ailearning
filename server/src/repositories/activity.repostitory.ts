import { AppDataSource } from "../config/database";
import { Activity } from "../models/activity";

export const activityRepository = AppDataSource.getRepository(Activity);
