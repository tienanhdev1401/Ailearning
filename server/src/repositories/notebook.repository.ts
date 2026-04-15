import { AppDataSource } from "../config/database";
import { Notebook } from "../models/notebook";

export const notebookRepository = AppDataSource.getRepository(Notebook);
