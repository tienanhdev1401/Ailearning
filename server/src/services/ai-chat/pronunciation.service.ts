import axios from "axios";
import FormData from "form-data";
import { AppDataSource } from "../../config/database";
import { AiConversation } from "../../models/aiConversation";
import { AiMessage } from "../../models/aiMessage";
import AI_MESSAGE_ROLE from "../../enums/aiMessageRole.enum";

export interface TurnScore {
  overall_score_0_5: number | null;
  overall_score_0_100: number | null;
  overall_label: string | null;
  sentence_band: string | null;
  audio_duration_sec: number | null;
  words: Array<{
    index: number;
    word: string;
    target_ipa: string;
    score_0_5: number | null;
    score_0_100: number | null;
    band: string | null;
  }>;
  phones: Array<{
    phone: string | null;
    score_0_5: number | null;
    band: string | null;
  }>;
  reject_reason?: string | null;
  raw?: unknown;
}

export interface PronunciationReport {
  generatedAt: string;
  source: "w2v_gop";
  status: "ok" | "skipped" | "failed";
  reason?: string;
  turnCount: number;
  processedTurnCount: number;
  overall: {
    score_0_5: number | null;
    score_0_100: number | null;
    label: string | null;
  };
  turns: Array<{
    messageId: number;
    text: string;
    score_0_5: number | null;
    score_0_100: number | null;
    label: string | null;
    sentenceBand: string | null;
    rejectReason?: string | null;
  }>;
  weakWords: Array<{ word: string; ipa: string; score_0_100: number; count: number }>;
  weakPhones: Array<{ phone: string; score_0_100: number; count: number }>;
}

const TIMEOUT_MS = 90_000;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundTo = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

class PronunciationService {
  private get baseUrl(): string {
    return (process.env.GOP_MODEL_URL || "http://127.0.0.1:5005").replace(/\/$/, "");
  }

  /**
   * Score a single learner turn against W2V_GOP /score using audio kept in memory.
   * Throws on transport / 5xx errors. For 4xx (e.g. audio rejected) returns a
   * TurnScore with a reject_reason so the caller can persist it without losing
   * the turn.
   */
  async scoreTurn(params: {
    text: string;
    audio: Buffer;
    filename: string;
    contentType: string;
  }): Promise<TurnScore> {
    const form = new FormData();
    form.append("text", params.text);
    form.append("audio", params.audio, {
      filename: params.filename,
      contentType: params.contentType,
    });

    const response = await axios.post(`${this.baseUrl}/score`, form, {
      headers: { ...form.getHeaders() },
      timeout: TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true,
    });

    if (response.status >= 500) {
      throw new Error(this.extractError(response.data));
    }

    if (response.status >= 400) {
      // Soft-failure (audio rejected etc.). Keep the turn but mark reason.
      return {
        overall_score_0_5: null,
        overall_score_0_100: null,
        overall_label: null,
        sentence_band: null,
        audio_duration_sec: null,
        words: [],
        phones: [],
        reject_reason: this.extractError(response.data),
        raw: response.data,
      };
    }

    return this.normalizeTurn(response.data);
  }

  /**
   * Build the conversation-level report by aggregating per-turn scores already
   * persisted on AiMessage.pronunciationScore. No additional W2V_GOP call.
   */
  async buildReport(conversationId: number): Promise<PronunciationReport> {
    const repo = AppDataSource.getRepository(AiConversation);
    const conversation = await repo.findOne({
      where: { id: conversationId },
      relations: ["messages"],
    });

    const generatedAt = new Date().toISOString();

    if (!conversation) {
      return {
        generatedAt,
        source: "w2v_gop",
        status: "skipped",
        reason: "conversation_not_found",
        turnCount: 0,
        processedTurnCount: 0,
        overall: { score_0_5: null, score_0_100: null, label: null },
        turns: [],
        weakWords: [],
        weakPhones: [],
      };
    }

    const userMessages = (conversation.messages ?? [])
      .filter((m) => m.role === AI_MESSAGE_ROLE.USER && (m.transcript ?? m.content)?.trim())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const audibleTurns = userMessages.filter((m) => !!m.pronunciationScore);

    if (audibleTurns.length === 0) {
      return {
        generatedAt,
        source: "w2v_gop",
        status: "skipped",
        reason: "no_user_audio",
        turnCount: userMessages.length,
        processedTurnCount: 0,
        overall: { score_0_5: null, score_0_100: null, label: null },
        turns: [],
        weakWords: [],
        weakPhones: [],
      };
    }

    const turnEntries: Array<{ message: AiMessage; score: TurnScore }> = [];
    for (const message of audibleTurns) {
      try {
        const parsed = JSON.parse(message.pronunciationScore as string) as TurnScore;
        turnEntries.push({ message, score: parsed });
      } catch (error) {
        // Skip malformed payloads silently.
      }
    }

    if (turnEntries.length === 0) {
      return {
        generatedAt,
        source: "w2v_gop",
        status: "failed",
        reason: "no_valid_turn_scores",
        turnCount: userMessages.length,
        processedTurnCount: 0,
        overall: { score_0_5: null, score_0_100: null, label: null },
        turns: [],
        weakWords: [],
        weakPhones: [],
      };
    }

    const validScores = turnEntries
      .map((t) => t.score.overall_score_0_5)
      .filter((s): s is number => s !== null);

    const overallScore05 =
      validScores.length > 0
        ? validScores.reduce((sum, n) => sum + n, 0) / validScores.length
        : null;

    const overallLabel = this.labelFor05(overallScore05);

    const turns = turnEntries.map((entry) => ({
      messageId: entry.message.id,
      text: (entry.message.transcript ?? entry.message.content ?? "").trim(),
      score_0_5: entry.score.overall_score_0_5,
      score_0_100: entry.score.overall_score_0_100,
      label: entry.score.overall_label,
      sentenceBand: entry.score.sentence_band,
      rejectReason: entry.score.reject_reason ?? null,
    }));

    return {
      generatedAt,
      source: "w2v_gop",
      status: "ok",
      turnCount: userMessages.length,
      processedTurnCount: validScores.length,
      overall: {
        score_0_5: overallScore05 !== null ? roundTo(overallScore05, 3) : null,
        score_0_100: overallScore05 !== null ? roundTo(overallScore05 * 20, 2) : null,
        label: overallLabel,
      },
      turns,
      weakWords: this.aggregateWeakWords(turnEntries),
      weakPhones: this.aggregateWeakPhones(turnEntries),
    };
  }

  private labelFor05(score: number | null): string | null {
    if (score === null) return null;
    if (score >= 4.0) return "Good";
    if (score >= 2.8) return "Fair";
    return "Needs work";
  }

  private aggregateWeakWords(
    turns: Array<{ score: TurnScore }>
  ): PronunciationReport["weakWords"] {
    const map = new Map<string, { word: string; ipa: string; total: number; count: number }>();
    for (const { score } of turns) {
      for (const word of score.words ?? []) {
        if (!word.word) continue;
        if (word.score_0_100 === null || word.score_0_100 >= 56) continue; // band < good
        const key = `${word.word}|${word.target_ipa}`;
        const entry = map.get(key) ?? {
          word: word.word,
          ipa: word.target_ipa,
          total: 0,
          count: 0,
        };
        entry.total += word.score_0_100;
        entry.count += 1;
        map.set(key, entry);
      }
    }
    return Array.from(map.values())
      .map((e) => ({
        word: e.word,
        ipa: e.ipa,
        score_0_100: roundTo(e.total / Math.max(e.count, 1), 1),
        count: e.count,
      }))
      .sort((a, b) => a.score_0_100 - b.score_0_100 || b.count - a.count)
      .slice(0, 8);
  }

  private aggregateWeakPhones(
    turns: Array<{ score: TurnScore }>
  ): PronunciationReport["weakPhones"] {
    const map = new Map<string, { phone: string; total: number; count: number }>();
    for (const { score } of turns) {
      for (const phone of score.phones ?? []) {
        if (!phone.phone) continue;
        if (phone.score_0_5 === null || phone.score_0_5 >= 2.8) continue;
        const entry = map.get(phone.phone) ?? { phone: phone.phone, total: 0, count: 0 };
        entry.total += phone.score_0_5 * 20;
        entry.count += 1;
        map.set(phone.phone, entry);
      }
    }
    return Array.from(map.values())
      .map((e) => ({
        phone: e.phone,
        score_0_100: roundTo(e.total / Math.max(e.count, 1), 1),
        count: e.count,
      }))
      .sort((a, b) => b.count - a.count || a.score_0_100 - b.score_0_100)
      .slice(0, 10);
  }

  private normalizeTurn(payload: unknown): TurnScore {
    const body =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

    const score05 = toFiniteNumber(body.overall_score_0_5);
    const score100 =
      toFiniteNumber(body.overall_score_0_100) ?? (score05 !== null ? score05 * 20 : null);

    const targets = Array.isArray(body.ipa_target_words)
      ? (body.ipa_target_words as unknown[])
      : [];
    const phonesRaw = Array.isArray(body.phones) ? (body.phones as unknown[]) : [];

    const phones = phonesRaw.map((row) => {
      const r =
        row && typeof row === "object" ? (row as Record<string, unknown>) : {};
      const s = toFiniteNumber(r.pred_phn_0_5);
      return {
        phone: typeof r.phone === "string" ? r.phone : null,
        score_0_5: s === null ? null : roundTo(clamp(s, 0, 5), 3),
        band: typeof r.phone_band === "string" ? r.phone_band : null,
      };
    });

    // Slice phones to words by phone count if available.
    let cursor = 0;
    const words = targets.map((t, idx) => {
      const row = t && typeof t === "object" ? (t as Record<string, unknown>) : {};
      const phoneList = Array.isArray(row.phones) ? (row.phones as unknown[]) : [];
      const remaining = Math.max(phones.length - cursor, 0);
      const chunkSize =
        idx === targets.length - 1
          ? remaining
          : Math.min(phoneList.length || 0, remaining);
      const chunk = phones.slice(cursor, cursor + chunkSize);
      cursor += chunkSize;

      const chunkScores = chunk
        .map((p) => p.score_0_5)
        .filter((v): v is number => v !== null);
      const avg05 =
        chunkScores.length > 0
          ? chunkScores.reduce((sum, n) => sum + n, 0) / chunkScores.length
          : score05;
      const ipa = typeof row.ipa === "string" ? row.ipa : phoneList.join(" ");
      return {
        index: typeof row.index === "number" ? row.index : idx + 1,
        word: typeof row.word === "string" ? row.word : `word_${idx + 1}`,
        target_ipa: ipa,
        score_0_5: avg05 !== null ? roundTo(clamp(avg05, 0, 5), 3) : null,
        score_0_100: avg05 !== null ? roundTo(clamp(avg05 * 20, 0, 100), 1) : null,
        band:
          avg05 === null
            ? null
            : avg05 >= 4
            ? "good"
            : avg05 < 2.8
            ? "weak"
            : "medium",
      };
    });

    return {
      overall_score_0_5: score05 !== null ? roundTo(clamp(score05, 0, 5), 3) : null,
      overall_score_0_100: score100 !== null ? roundTo(clamp(score100, 0, 100), 2) : null,
      overall_label: typeof body.overall_label === "string" ? body.overall_label : null,
      sentence_band: typeof body.sentence_band === "string" ? body.sentence_band : null,
      audio_duration_sec: toFiniteNumber(body.audio_duration_sec),
      words,
      phones,
    };
  }

  private extractError(payload: unknown): string {
    if (!payload) return "no response body";
    if (typeof payload === "string") return payload;
    if (typeof payload !== "object") return String(payload);
    const obj = payload as Record<string, unknown>;
    const detail = obj.detail;
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      const d = detail as Record<string, unknown>;
      if (typeof d.reject_reason === "string") return d.reject_reason;
      if (typeof d.error === "string") return d.error;
      try {
        return JSON.stringify(d);
      } catch {
        return "error";
      }
    }
    if (typeof obj.message === "string") return obj.message;
    try {
      return JSON.stringify(obj);
    } catch {
      return "error";
    }
  }
}

export const pronunciationService = new PronunciationService();
