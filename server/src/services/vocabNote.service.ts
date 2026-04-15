import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { vocabNoteRepository } from "../repositories/vocabNote.repository";
import { VocabNote } from "../models/vocabNote";
import { CreateVocabNoteDto } from "../dto/request/CreateVocabNoteDTO";

export class VocabNoteService {
  static async addNote(userId: number, dto: CreateVocabNoteDto): Promise<VocabNote> {
    try {
      const newNote = vocabNoteRepository.create({
        userId,
        term: dto.term,
        definition: dto.definition,
        source: dto.source || null,
      });
      return await vocabNoteRepository.save(newNote);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ApiError(HttpStatusCode.Conflict, "Từ này đã có trong sổ tay của bạn.");
      }
      throw error;
    }
  }

  static async getMyNotes(userId: number, page: number = 1, limit: number = 20): Promise<{ data: VocabNote[], total: number }> {
    const [data, total] = await vocabNoteRepository.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  static async deleteNote(userId: number, id: number): Promise<boolean> {
    const note = await vocabNoteRepository.findOne({
      where: { id, userId }
    });

    if (!note) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy từ vựng này hoặc bạn không có quyền xóa.");
    }

    await vocabNoteRepository.remove(note);
    return true;
  }
}
