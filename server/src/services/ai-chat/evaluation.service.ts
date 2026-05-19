import { AppDataSource } from "../../config/database";
import { AiConversation } from "../../models/aiConversation";
import { AiEvaluation } from "../../models/aiEvaluation";
import AI_MESSAGE_ROLE from "../../enums/aiMessageRole.enum";
import { geminiService } from "./gemini.service";
import { promptService } from "../ai/prompt.service";
import type { PronunciationReport } from "./pronunciation.service";

const FEATURE_AI_CHAT = "ai_chat";

interface EvaluationPayload {
  pronunciationScore: number;
  prosodyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  summary: string;
  suggestions?: string[];
}

class EvaluationService {
  async evaluateConversation(
    conversationId: number,
    pronunciationReport?: PronunciationReport | null
  ): Promise<AiEvaluation> {
    const conversationRepo = AppDataSource.getRepository(AiConversation);
    const evaluationRepo = AppDataSource.getRepository(AiEvaluation);

    const conversation = await conversationRepo.findOne({
      where: { id: conversationId },
      relations: ["messages", "evaluation"],
      order: { messages: { createdAt: "ASC" } },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const transcript = conversation.messages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((message) => {
        const speaker = message.role === AI_MESSAGE_ROLE.USER ? "Learner" : "AI";
        return `${speaker}: ${message.transcript ?? message.content}`.trim();
      })
      .join("\n");

    const pronunciationEvidence = this.buildPronunciationEvidence(pronunciationReport);

    let promptText: string;
    let temperature = 0.3;
    let maxOutputTokens = 1500;
    try {
      const rendered = await promptService.render(
        FEATURE_AI_CHAT,
        "evaluation",
        { transcript, pronunciationEvidence }
      );
      promptText = rendered.text;
      temperature = rendered.resolved.config.temperature ?? temperature;
      maxOutputTokens = rendered.resolved.config.maxOutputTokens ?? maxOutputTokens;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Evaluation] Failed to render prompt for conversation ${conversationId}: ${errMsg}`);
      throw new Error(
        `Evaluation prompt not available. Ensure 'ai_chat:evaluation' prompt is seeded in the database. ` +
        `Run server bootstrap or check ai_prompts table. Original error: ${errMsg}`
      );
    }

    const raw = await geminiService.generate({
      prompt: promptText,
      history: [],
      temperature,
      responseMimeType: "application/json",
      maxOutputTokens,
    });

    let parsedRaw: unknown;
    try {
      parsedRaw = JSON.parse(this.stripJsonFences(raw));
    } catch (error) {
      console.error("[Evaluation] JSON parse failed. Raw response:", raw);
      throw new Error(`Failed to parse evaluation JSON: ${raw.slice(0, 200)}`);
    }

    const parsed = this.normalizeEvaluation(parsedRaw);

    const evaluation = conversation.evaluation ?? evaluationRepo.create({ conversation });
    evaluation.pronunciationScore = parsed.pronunciationScore ?? 0;
    evaluation.prosodyScore = parsed.prosodyScore ?? 0;
    evaluation.grammarScore = parsed.grammarScore ?? 0;
    evaluation.vocabularyScore = parsed.vocabularyScore ?? 0;
    evaluation.summary = parsed.summary ?? null;
    evaluation.rawDetails = JSON.stringify(parsedRaw, null, 2);

    return evaluationRepo.save(evaluation);
  }

  /**
   * Strip ```json ... ``` fences that some Gemini responses include despite
   * the responseMimeType=application/json hint.
   */
  private stripJsonFences(raw: string): string {
    const trimmed = raw.trim();
    if (trimmed.startsWith("```")) {
      return trimmed
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
    }
    return trimmed;
  }

  /**
   * Tolerant extractor: Gemini sometimes returns snake_case or wraps the
   * scores under a "scores" object. We probe a few common shapes and clamp
   * everything to the 0-10 range.
   */
  private normalizeEvaluation(input: unknown): EvaluationPayload {
    const root =
      input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const scores =
      root.scores && typeof root.scores === "object"
        ? (root.scores as Record<string, unknown>)
        : root;

    const pickScore = (...keys: string[]): number => {
      for (const key of keys) {
        const value = scores[key] ?? root[key];
        const num = this.toNumber(value);
        if (num !== null) return Math.max(0, Math.min(10, num));
      }
      return 0;
    };

    const summary =
      this.firstString(root.summary, root.feedback, root.comment, root.overall_summary) ?? "";

    let suggestions: string[] | undefined;
    const rawSuggestions =
      root.suggestions ?? root.recommendations ?? root.tips ?? root.advice;
    if (Array.isArray(rawSuggestions)) {
      suggestions = rawSuggestions
        .map((item) =>
          typeof item === "string"
            ? item
            : item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string"
            ? (item as { text: string }).text
            : null
        )
        .filter((item): item is string => !!item && item.trim().length > 0);
    }

    return {
      pronunciationScore: pickScore("pronunciationScore", "pronunciation_score", "pronunciation"),
      prosodyScore: pickScore(
        "prosodyScore",
        "prosody_score",
        "prosody",
        "fluencyScore",
        "fluency_score",
        "fluency"
      ),
      grammarScore: pickScore("grammarScore", "grammar_score", "grammar"),
      vocabularyScore: pickScore("vocabularyScore", "vocabulary_score", "vocabulary"),
      summary,
      suggestions,
    };
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private firstString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  }

  /**
   * Build a compact, human-readable pronunciation evidence block to feed
   * Gemini. Uses the aggregated W2V_GOP report so Gemini does not have to
   * guess pronunciation/prosody from text alone.
   */
  private buildPronunciationEvidence(report: PronunciationReport | null | undefined): string {
    if (!report) {
      return "(No pronunciation data available — the learner did not record any audio.)";
    }
    if (report.status !== "ok") {
      const reason = report.reason ? ` (reason: ${report.reason})` : "";
      return `(Pronunciation analysis ${report.status}${reason}; no acoustic scores available.)`;
    }

    const lines: string[] = [];
    const overall100 = report.overall?.score_0_100;
    const overall5 = report.overall?.score_0_5;
    const label = report.overall?.label;
    if (typeof overall100 === "number") {
      lines.push(
        `Average GOP score: ${overall100.toFixed(1)}/100 (≈ ${overall5?.toFixed?.(2) ?? "?"}/5)${
          label ? ` — band "${label}"` : ""
        }.`
      );
    }
    lines.push(
      `Turns scored: ${report.processedTurnCount}/${report.turnCount}.`
    );

    const weakWords = (report.weakWords ?? []).slice(0, 6);
    if (weakWords.length > 0) {
      const formatted = weakWords
        .map((w) => `${w.word}${w.ipa ? ` /${w.ipa}/` : ""} = ${Math.round(w.score_0_100)}/100`)
        .join("; ");
      lines.push(`Weak words: ${formatted}.`);
    } else {
      lines.push("Weak words: none flagged.");
    }

    const weakPhones = (report.weakPhones ?? []).slice(0, 6);
    if (weakPhones.length > 0) {
      const formatted = weakPhones
        .map((p) => `/${p.phone}/ = ${Math.round(p.score_0_100)}/100 (×${p.count})`)
        .join("; ");
      lines.push(`Weak phones: ${formatted}.`);
    } else {
      lines.push("Weak phones: none flagged.");
    }

    return lines.join("\n");
  }
}

export const evaluationService = new EvaluationService();
