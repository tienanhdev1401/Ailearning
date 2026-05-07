import { Request, Response, NextFunction } from "express";
import { EdgeTTS } from "@andresaya/edge-tts";
import ApiError from "../utils/ApiError";
import { HttpStatusCode } from "axios";

class TTSController {
  private static tts = new EdgeTTS();

  static async generateTTS(req: Request, res: Response, next: NextFunction) {
    try {
      const text = req.query.text as string;
      const voice = (req.query.voice as string) || "vi-VN-HoaiMyNeural";

      if (!text) {
        return next(new ApiError(HttpStatusCode.BadRequest, "Text is required"));
      }

      // Using @andresaya/edge-tts
      await TTSController.tts.synthesize(text, voice);
      const buffer = TTSController.tts.toBuffer();
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(buffer);
    } catch (err: any) {
      console.error("TTS Generation Error:", err);
      next(new ApiError(HttpStatusCode.InternalServerError, "Failed to generate speech"));
    }
  }
}

export default TTSController;
