import { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { plainToInstance } from "class-transformer";
import { VocabNoteService } from "../services/vocabNote.service";
import { CreateVocabNoteDto } from "../dto/request/CreateVocabNoteDTO";
import ApiError from "../utils/ApiError";

class VocabNoteController {
  static async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Bạn cần đăng nhập để thực hiện thao tác này.");
      }

      const dto = plainToInstance(CreateVocabNoteDto, req.body);
      const newNote = await VocabNoteService.addNote(userId, dto);
      res.status(HttpStatusCode.Created).json(newNote);
    } catch (error) {
      next(error);
    }
  }

  static async getMyNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Bạn cần đăng nhập.");
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await VocabNoteService.getMyNotes(userId, page, limit);
      res.status(HttpStatusCode.Ok).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const id = Number(req.params.id);

      if (!userId) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Bạn cần đăng nhập.");
      }

      await VocabNoteService.deleteNote(userId, id);
      res.status(HttpStatusCode.Ok).json({ message: "Đã xóa từ vựng khỏi sổ tay." });
    } catch (error) {
      next(error);
    }
  }
}

export default VocabNoteController;
