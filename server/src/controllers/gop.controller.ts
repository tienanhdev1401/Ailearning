import axios, { HttpStatusCode } from "axios";
import { Request, Response, NextFunction } from "express";
import FormData from "form-data";
import ApiError from "../utils/ApiError";

type UpstreamPhoneRow = {
  position?: unknown;
  phone?: unknown;
  start_ms?: unknown;
  end_ms?: unknown;
  duration_ms?: unknown;
  pred_phn_0_5?: unknown;
  phone_band?: unknown;
};

type UpstreamWordTargetRow = {
  index?: unknown;
  word?: unknown;
  ipa?: unknown;
  phones?: unknown;
};

type ScoreBand = "weak" | "medium" | "good";

type ScorePhoneV2 = {
  position: number | null;
  phone: string | null;
  start_ms: number | null;
  end_ms: number | null;
  duration_ms: number | null;
  score_0_5: number | null;
  score_0_100: number | null;
  band: string | null;
};

type ScoreWordV2 = {
  index: number;
  word: string;
  target_ipa: string;
  predicted_ipa: string | null;
  phone_count: number;
  score_0_5: number;
  score_0_100: number;
  accuracy: number;
  band: ScoreBand;
  label: 1 | 2 | 3;
  phones: ScorePhoneV2[];
};

type ScoreResponseV2 = {
  version: "v2";
  provider: "w2v_gop";
  mode: "sentence";
  request: {
    text: string;
    filename: string;
  };
  summary: {
    overall_score_0_5: number;
    overall_score_0_100: number;
    overall_label: string | null;
    sentence_band: string | null;
    word_count: number;
    phone_count: number;
    all_words_good: boolean;
  };
  words: ScoreWordV2[];
  phones: ScorePhoneV2[];
  metrics: {
    scores_0_5: Record<string, unknown> | null;
    scores_normalized: Record<string, unknown> | null;
    audio_duration_sec: number | null;
    token_count: number | null;
  };
  meta: {
    threshold_profile_version: string | null;
    model_version: string | null;
    calibration_version: string | null;
    score_source: "w2v_gop_model_v2";
  };
};

type WordTargetV2 = {
  index: number;
  word: string;
  target_ipa: string;
  phone_count: number | null;
};

const SCORE_WEAK_LT_05 = 2.8;
const SCORE_GOOD_GTE_05 = 4.0;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const roundTo = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toFiniteInteger = (value: unknown): number | null => {
  const parsed = toFiniteNumber(value);
  return parsed === null ? null : Math.round(parsed);
};

const score05ToBand = (score05: number): ScoreBand => {
  if (score05 >= SCORE_GOOD_GTE_05) {
    return "good";
  }
  if (score05 < SCORE_WEAK_LT_05) {
    return "weak";
  }
  return "medium";
};

const bandToLegacyLabel = (band: ScoreBand): 1 | 2 | 3 => {
  if (band === "good") {
    return 1;
  }
  if (band === "medium") {
    return 2;
  }
  return 3;
};

const normalizeIpaForCompare = (value: string | null): string => {
  if (!value) {
    return "";
  }
  return value.trim().replace(/\s+/g, " ");
};

const normalizePhones = (phones: UpstreamPhoneRow[]): ScorePhoneV2[] => {
  return phones.map((row) => {
    const score05 = toFiniteNumber(row.pred_phn_0_5);
    return {
      position: toFiniteInteger(row.position),
      phone: typeof row.phone === "string" && row.phone.trim() ? row.phone.trim() : null,
      start_ms: toFiniteInteger(row.start_ms),
      end_ms: toFiniteInteger(row.end_ms),
      duration_ms: toFiniteInteger(row.duration_ms),
      score_0_5: score05 === null ? null : roundTo(clamp(score05, 0, 5), 3),
      score_0_100: score05 === null ? null : roundTo(clamp(score05 * 20, 0, 100), 2),
      band: typeof row.phone_band === "string" ? row.phone_band : null,
    };
  });
};

const normalizeWordTargets = (upstreamTargets: UpstreamWordTargetRow[]): WordTargetV2[] => {
  if (!Array.isArray(upstreamTargets) || upstreamTargets.length === 0) {
    return [];
  }

  return upstreamTargets.map((row, index) => {
    const normalizedWord =
      typeof row.word === "string" && row.word.trim() ? row.word.trim().toLowerCase() : `word_${index + 1}`;
    const phonesFromLegacy = Array.isArray(row.phones)
      ? row.phones
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter((item) => item.length > 0)
      : [];
    const targetIpaFromLegacy = typeof row.ipa === "string" && row.ipa.trim() ? row.ipa.trim() : "";
    const targetIpaFromPhones = phonesFromLegacy.length > 0 ? phonesFromLegacy.join(" ") : "";
    const targetIpa = targetIpaFromLegacy || targetIpaFromPhones;

    const phoneCount = phonesFromLegacy.length > 0 ? phonesFromLegacy.length : null;

    return {
      index: toFiniteInteger(row.index) ?? index + 1,
      word: normalizedWord,
      target_ipa: targetIpa || "",
      phone_count: phoneCount !== null && phoneCount >= 0 ? phoneCount : null,
    };
  });
};

const extractUpstreamWordTargets = (body: Record<string, unknown>): UpstreamWordTargetRow[] => {
  if (Array.isArray(body.ipa_target_words) && body.ipa_target_words.length > 0) {
    return body.ipa_target_words as UpstreamWordTargetRow[];
  }

  return [];
};

const splitPhonesByWordTargets = (phones: ScorePhoneV2[], targets: WordTargetV2[]): ScorePhoneV2[][] => {
  if (targets.length === 0) {
    return [];
  }

  let currentIndex = 0;
  return targets.map((target, index) => {
    const remainingPhones = Math.max(phones.length - currentIndex, 0);
    let chunkSize = 0;

    if (index === targets.length - 1) {
      chunkSize = remainingPhones;
    } else if (target.phone_count !== null) {
      chunkSize = Math.min(Math.max(target.phone_count, 0), remainingPhones);
    } else {
      const remainingWords = targets.length - index;
      chunkSize = Math.floor(remainingPhones / Math.max(remainingWords, 1));
    }

    const chunk = phones.slice(currentIndex, currentIndex + chunkSize);
    currentIndex += chunkSize;
    return chunk;
  });
};

const buildWordsFromPhones = (
  phones: ScorePhoneV2[],
  fallbackScore05: number,
  upstreamTargets: UpstreamWordTargetRow[]
): ScoreWordV2[] => {
  const wordTargets = normalizeWordTargets(upstreamTargets);
  if (wordTargets.length === 0) {
    return [];
  }

  const chunks = splitPhonesByWordTargets(phones, wordTargets);
  return wordTargets.map((target, index) => {
    const chunk = chunks[index] ?? [];
    const chunkScores = chunk
      .map((item) => item.score_0_5)
      .filter((score): score is number => score !== null);

    const score05 =
      chunkScores.length > 0
        ? chunkScores.reduce((sum, current) => sum + current, 0) / chunkScores.length
        : fallbackScore05;

    const predictedIpa = chunk.map((item) => item.phone ?? "").filter(Boolean).join(" ");
    const predictedIpaNormalized = normalizeIpaForCompare(predictedIpa || null);
    const targetIpaNormalized = normalizeIpaForCompare(target.target_ipa || null);
    const predictedIpaForUi =
      predictedIpaNormalized && predictedIpaNormalized !== targetIpaNormalized ? predictedIpaNormalized : null;
    const band = score05ToBand(score05);

    return {
      index: target.index,
      word: target.word,
      target_ipa: target.target_ipa,
      predicted_ipa: predictedIpaForUi,
      phone_count: chunk.length,
      score_0_5: roundTo(clamp(score05, 0, 5), 3),
      score_0_100: roundTo(clamp(score05 * 20, 0, 100), 2),
      accuracy: roundTo(clamp(score05 / 5, 0, 1), 3),
      band,
      label: bandToLegacyLabel(band),
      phones: chunk,
    };
  });
};

class GopController {
  private static getUpstreamErrorMessage(payload: unknown): string {
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    if (!payload || typeof payload !== "object") {
      return "GOP service error";
    }

    const body = payload as Record<string, unknown>;
    const { message, detail, error } = body;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (detail && typeof detail === "object") {
      const detailObject = detail as Record<string, unknown>;
      if (typeof detailObject.reject_reason === "string" && detailObject.reject_reason.trim()) {
        return detailObject.reject_reason;
      }
      if (typeof detailObject.error === "string" && detailObject.error.trim()) {
        return detailObject.error;
      }
      try {
        return JSON.stringify(detailObject);
      } catch {
        return "GOP service error";
      }
    }

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    try {
      return JSON.stringify(body);
    } catch {
      return "GOP service error";
    }
  }

  private static normalizeScoreResponseV2(text: string, filename: string, payload: unknown): ScoreResponseV2 {
    const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

    const score05FromRoot = toFiniteNumber(body.overall_score_0_5);
    const scores05 =
      body.scores_0_5 && typeof body.scores_0_5 === "object"
        ? (body.scores_0_5 as Record<string, unknown>)
        : null;
    const score05FromBlock = scores05 ? toFiniteNumber(scores05.final_smoothed) : null;
    const overallScore05Raw = score05FromRoot ?? score05FromBlock;

    if (overallScore05Raw === null) {
      throw new ApiError(HttpStatusCode.BadGateway, "Invalid response from W2V_GOP: missing overall_score_0_5");
    }

    const overallScore05 = clamp(overallScore05Raw, 0, 5);
    const overallScore100 = clamp(toFiniteNumber(body.overall_score_0_100) ?? overallScore05 * 20, 0, 100);

    const rawPhones = Array.isArray(body.phones) ? (body.phones as UpstreamPhoneRow[]) : [];
    const rawWordTargets = extractUpstreamWordTargets(body);
    if (rawWordTargets.length === 0) {
      throw new ApiError(HttpStatusCode.BadGateway, "Invalid response from W2V_GOP: missing ipa_target_words");
    }
    const phones = normalizePhones(rawPhones);
    const words = buildWordsFromPhones(phones, overallScore05, rawWordTargets);
    const allWordsGood = words.length > 0 && words.every((word) => word.label === 1);

    const meta = body.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : {};
    const scoresNormalized =
      body.scores_normalized && typeof body.scores_normalized === "object"
        ? (body.scores_normalized as Record<string, unknown>)
        : null;

    return {
      version: "v2",
      provider: "w2v_gop",
      mode: "sentence",
      request: {
        text,
        filename,
      },
      summary: {
        overall_score_0_5: roundTo(overallScore05, 3),
        overall_score_0_100: roundTo(overallScore100, 2),
        overall_label: typeof body.overall_label === "string" ? body.overall_label : null,
        sentence_band: typeof body.sentence_band === "string" ? body.sentence_band : null,
        word_count: words.length,
        phone_count: phones.length,
        all_words_good: allWordsGood,
      },
      words,
      phones,
      metrics: {
        scores_0_5: scores05,
        scores_normalized: scoresNormalized,
        audio_duration_sec: toFiniteNumber(body.audio_duration_sec),
        token_count: toFiniteInteger(body.token_count),
      },
      meta: {
        threshold_profile_version:
          typeof body.threshold_profile_version === "string" ? body.threshold_profile_version : null,
        model_version: typeof meta.model_version === "string" ? meta.model_version : null,
        calibration_version: typeof meta.calibration_version === "string" ? meta.calibration_version : null,
        score_source: "w2v_gop_model_v2",
      },
    };
  }

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
        throw new ApiError(upstream.status, GopController.getUpstreamErrorMessage(upstream.data));
      }

      const normalizedResponse = GopController.normalizeScoreResponseV2(
        text,
        file.originalname || "recording.wav",
        upstream.data
      );
      res.status(HttpStatusCode.Ok).json(normalizedResponse);
    } catch (err: any) {
      if (["ECONNREFUSED", "ECONNABORTED", "ENOTFOUND", "EHOSTUNREACH"].includes(err?.code)) {
        return next(new ApiError(HttpStatusCode.ServiceUnavailable, "W2V_GOP Service is not available"));
      }
      next(err);
    }
  }
}

export default GopController;
