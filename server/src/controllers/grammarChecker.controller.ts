// controllers/grammarChecker.controller.ts
import axios, { HttpStatusCode } from "axios";
import { randomUUID } from "crypto";
import ApiError from "../utils/ApiError";
import { Request, Response, NextFunction } from "express";

interface SaplingEdit {
  id?: string;
  sentence: string;
  sentence_start: number;
  start: number;
  end: number;
  replacement: string;
  error_type?: string;
  general_error_type?: string;
}

/**
 * Apply Sapling edits to the original text manually.
 * Used as a fallback when `auto_apply` is not set or `applied_text` is missing.
 * Edits use offsets relative to their sentence, so absolute offset = sentence_start + start.
 * Apply right-to-left to keep earlier offsets valid.
 */
function applyEdits(text: string, edits: SaplingEdit[]): string {
  const sorted = [...edits].sort(
    (a, b) => (b.sentence_start + b.start) - (a.sentence_start + a.start)
  );

  let result = text;
  for (const e of sorted) {
    const absStart = e.sentence_start + e.start;
    const absEnd = e.sentence_start + e.end;
    if (absStart < 0 || absEnd > result.length || absStart > absEnd) continue;
    result = result.slice(0, absStart) + e.replacement + result.slice(absEnd);
  }
  return result;
}

class GrammarCheckerController {
  /**
   * Grammar correction using Sapling AI Edits API.
   * Docs: https://sapling.ai/docs/api/edits-overview
   *
   * Env:
   *   - SAPLING_API_KEY        (required)
   *   - SAPLING_API_URL        (default: https://api.sapling.ai/api/v1/edits)
   *   - SAPLING_LANGUAGE       (default: en)
   *   - SAPLING_SESSION_ID     (optional; if absent a random UUID is generated per request)
   */
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body as { text: string };

      const apiKey = process.env.SAPLING_API_KEY;
      if (!apiKey) {
        return next(new ApiError(
          HttpStatusCode.InternalServerError,
          "Missing SAPLING_API_KEY environment variable"
        ));
      }

      const apiUrl = process.env.SAPLING_API_URL || "https://api.sapling.ai/api/v1/edits";
      const language = process.env.SAPLING_LANGUAGE || "en";
      const sessionId = process.env.SAPLING_SESSION_ID || randomUUID();

      const response = await axios.post(
        apiUrl,
        {
          key: apiKey,
          text,
          session_id: sessionId,
          lang: language,
          auto_apply: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 20000,
        }
      );

      const data = response.data || {};
      const edits: SaplingEdit[] = Array.isArray(data.edits) ? data.edits : [];
      const corrected: string =
        typeof data.applied_text === "string" && data.applied_text.length > 0
          ? data.applied_text
          : applyEdits(text, edits);

      res.status(HttpStatusCode.Ok).json({
        result: corrected,
        original: text,
        edits,
      });
    } catch (err: any) {
      if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNABORTED"].includes(err?.code)) {
        return next(new ApiError(HttpStatusCode.ServiceUnavailable, "GrammarChecker Service is not available"));
      }
      if (axios.isAxiosError(err) && err.response) {
        const upstreamMessage =
          (err.response.data && (err.response.data.msg || err.response.data.message)) ||
          err.response.statusText ||
          "Sapling API error";
        return next(new ApiError(err.response.status, `Sapling API error: ${upstreamMessage}`));
      }
      next(err);
    }
  }
}

export default GrammarCheckerController;
