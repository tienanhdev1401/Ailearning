import { AppDataSource } from "../config/database";
import { Day } from "../models/day";

export const dayRepository = AppDataSource.getRepository(Day);
