import { AppDataSource } from "../config/database";
import { Activity } from "../models/activity";

export const dayRepository = AppDataSource.getRepository(Activity);
