import { AppDataSource } from "../config/database";
import { MiniGame } from "../models/minigame";

export const minigameRepository = AppDataSource.getRepository(MiniGame).extend({});
