// controllers/grammarChecker.controller.js
import axios, { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

class GrammarCheckerController {
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      const baseUrl = (process.env.GRAMMAR_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");
      const response = await axios.post(`${baseUrl}/generate`, { text });
      res.status(HttpStatusCode.Ok).json(response.data);
    } catch (err: any) {
      if (err.code === "ECONNREFUSED") {
        throw new ApiError(HttpStatusCode.ServiceUnavailable, "GrammarChecker Service is not available");
      }
      next(err);
    }
  }
}

export default GrammarCheckerController;
