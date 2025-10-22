// src/repositories/user.repository.ts
import { AppDataSource } from "../config/database";
import { User } from "../models/user";

export const userRepository = AppDataSource.getRepository(User).extend({});
