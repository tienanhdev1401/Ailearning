import axios, { HttpStatusCode } from "axios";
import { Request, Response, NextFunction } from "express";
import FormData from "form-data";
import ApiError from "../utils/ApiError";

class GopController {
  static async score(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const text = (req.body?.text as string | undefined) ?? "";

      if (!text || !text.trim()) {
        throw new ApiError(HttpStatusCode.BadRequest, "Thiếu 'text'");
      }
      if (!file) {
        throw new ApiError(HttpStatusCode.BadRequest, "Thiếu file audio (field: audio)");
      }

      const gopBaseUrl = (process.env.GOP_MODEL_URL || "http://127.0.0.1:5005").replace(/\/$/, "");

      const form = new FormData();
      form.append("text", text);
      form.append("audio", file.buffer, {
        filename: file.originalname || "recording.wav",
        contentType: file.mimetype || "audio/wav",
      });

      const upstream = await axios.post(`${gopBaseUrl}/score`, form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 120000,
        validateStatus: () => true,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });

      if (upstream.status >= 400) {
        throw new ApiError(
          upstream.status,
          typeof upstream.data === "string" ? upstream.data : upstream.data?.message || "GOP service error"
        );
      }

      res.status(HttpStatusCode.Ok).json(upstream.data);
    } catch (err: any) {
      if (err?.code === "ECONNREFUSED") {
        return next(new ApiError(HttpStatusCode.ServiceUnavailable, "GOP-model Service is not available"));
      }
      next(err);
    }
  }
}

export default GopController;
