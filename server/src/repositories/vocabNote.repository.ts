import { AppDataSource } from "../config/database";
import { VocabNote } from "../models/vocabNote";

export const vocabNoteRepository = AppDataSource.getRepository(VocabNote);
