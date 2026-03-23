import { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { notebookRepository } from "../repositories/notebook.repository";
import { vocabNoteRepository } from "../repositories/vocabNote.repository";
import { Notebook } from "../models/notebook";
import { VocabNote } from "../models/vocabNote";

export class NotebookService {
  static async createNotebook(userId: number, title: string, description?: string): Promise<Notebook> {
    const notebook = notebookRepository.create({
      userId,
      title,
      description: description || null,
    });
    return await notebookRepository.save(notebook);
  }

  static async getMyNotebooks(userId: number): Promise<Notebook[]> {
    return await notebookRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      relations: ["notes"],
    });
  }

  static async getNotebookById(userId: number, id: number): Promise<Notebook> {
    const notebook = await notebookRepository.findOne({
      where: { id, userId },
      relations: ["notes"],
    });

    if (!notebook) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy sổ tay này.");
    }

    return notebook;
  }

  static async updateNotebook(userId: number, id: number, title: string, description?: string): Promise<Notebook> {
    const notebook = await this.getNotebookById(userId, id);
    notebook.title = title;
    notebook.description = description || null;
    return await notebookRepository.save(notebook);
  }

  static async deleteNotebook(userId: number, id: number): Promise<boolean> {
    const notebook = await this.getNotebookById(userId, id);
    await notebookRepository.remove(notebook);
    return true;
  }

  static async addCardToNotebook(userId: number, notebookId: number, term: string, definition: string, source?: string): Promise<VocabNote> {
    const notebook = await this.getNotebookById(userId, notebookId);

    try {
      const newNote = vocabNoteRepository.create({
        userId,
        notebookId,
        term,
        definition,
        source: source || null,
      });

      return await vocabNoteRepository.save(newNote);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ApiError(HttpStatusCode.Conflict, "Từ này đã có trong sổ tay của bạn.");
      }
      throw error;
    }
  }
}
