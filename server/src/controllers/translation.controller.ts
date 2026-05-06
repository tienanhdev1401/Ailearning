// controllers/translation.controller.ts
import axios, { HttpStatusCode } from "axios";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

interface TranslationBody {
  text: string;
  src_lang?: string;
  tgt_lang?: string;
  num_beams?: number;
}

class TranslationController {
  /**
   * Proxy translation requests to the self-hosted NLLB-style fine-tuned model service.
   *
   * Env:
   *   - TRANSLATION_SERVICE_URL  (default: http://127.0.0.1:5001)
   *
   * Upstream contract (expected at the model service):
   *   POST /translate
   *   body: { text, src_lang, tgt_lang, num_beams }
   *   returns: { result: <translated text> }
   *
   * The controller is tolerant of common alternate field names
   * (`translation`, `translated_text`, `output`).
   */
  static async translate(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, src_lang, tgt_lang, num_beams } = req.body as TranslationBody;

      const baseUrl = (process.env.TRANSLATION_SERVICE_URL || "http://127.0.0.1:5001").replace(/\/$/, "");

      const upstream = await axios.post(
        `${baseUrl}/translate`,
        {
          text,
          src_lang: src_lang || "eng_Latn",
          tgt_lang: tgt_lang || "vie_Latn",
          num_beams: typeof num_beams === "number" ? num_beams : 5,
        },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 60000,
          validateStatus: () => true,
        }
      );

      if (upstream.status >= 400) {
        const message =
          (upstream.data && (upstream.data.message || upstream.data.error || upstream.data.detail)) ||
          `Translation service returned ${upstream.status}`;
        return next(new ApiError(upstream.status, String(message)));
      }

      const data = upstream.data || {};
      const result: string =
        data.result ??
        data.translation ??
        data.translated_text ??
        data.output ??
        "";

      res.status(HttpStatusCode.Ok).json({
        result,
        original: text,
        src_lang: src_lang || "eng_Latn",
        tgt_lang: tgt_lang || "vie_Latn",
      });
    } catch (err: any) {
      if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNABORTED", "EHOSTUNREACH"].includes(err?.code)) {
        return next(new ApiError(HttpStatusCode.ServiceUnavailable, "Translation Service is not available"));
      }
      if (axios.isAxiosError(err) && err.response) {
        return next(new ApiError(err.response.status, `Translation service error: ${err.response.statusText}`));
      }
      next(err);
    }
  }
}

export default TranslationController;
