import { Request, Response, NextFunction } from "express";
import { NotebookService } from "../services/notebook.service";
import { HttpStatusCode } from "axios";

export class NotebookController {
  static async createNotebook(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;
      const userId = (req as any).user.id;
      const notebook = await NotebookService.createNotebook(userId, title, description);
      res.status(HttpStatusCode.Created).json(notebook);
    } catch (error) {
      next(error);
    }
  }

  static async getMyNotebooks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notebooks = await NotebookService.getMyNotebooks(userId);
      res.json(notebooks);
    } catch (error) {
      next(error);
    }
  }

  static async getNotebookById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const notebook = await NotebookService.getNotebookById(userId, parseInt(id));
      res.json(notebook);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotebook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { title, description } = req.body;
      const notebook = await NotebookService.updateNotebook(userId, parseInt(id), title, description);
      res.json(notebook);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNotebook(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      await NotebookService.deleteNotebook(userId, parseInt(id));
      res.status(HttpStatusCode.NoContent).send();
    } catch (error) {
      next(error);
    }
  }

  static async addCard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { term, definition, source } = req.body;
      const card = await NotebookService.addCardToNotebook(userId, parseInt(id), term, definition, source);
      res.status(HttpStatusCode.Created).json(card);
    } catch (error) {
      next(error);
    }
  }
}
