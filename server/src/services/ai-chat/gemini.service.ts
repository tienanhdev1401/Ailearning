import axios, { AxiosInstance } from "axios";

export type GeminiContent = {
  role: "user" | "model" | "assistant" | "system";
  parts: Array<{ text: string }>;
};

interface GeminiGenerateOptions {
  prompt: string;
  history?: GeminiContent[];
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  /**
   * For Gemini 2.5+ "thinking" models. Set 0 (default) to disable internal
   * reasoning so the entire output budget is spent on the final answer.
   * Set to a positive number to allow up to N reasoning tokens.
   */
  thinkingBudget?: number;
}

export class GeminiService {
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly http: AxiosInstance;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

    const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}`;

    this.http = axios.create({
      baseURL,
      params: {
        key: this.apiKey,
      },
    });
  }

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured. Set GEMINI_API_KEY in environment variables.");
    }
  }

  async generate(options: GeminiGenerateOptions): Promise<string> {
    this.ensureConfigured();

    const {
      prompt,
      history = [],
      temperature = 0.8,
      topP = 0.9,
      maxOutputTokens = 750,
      responseMimeType,
      thinkingBudget = 0,
    } = options;

    const generationConfig: Record<string, unknown> = {
      temperature,
      topP,
      maxOutputTokens,
    };

    if (responseMimeType) {
      generationConfig["responseMimeType"] = responseMimeType;
    }

    // Gemini 2.5+ "thinking" models burn output tokens on internal reasoning by
    // default, which truncates real responses. Pin the budget so the full
    // maxOutputTokens stays available for the visible answer.
    if (this.supportsThinkingConfig()) {
      generationConfig["thinkingConfig"] = { thinkingBudget };
    }

    const payload: Record<string, unknown> = {
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig,
    };

    try {
      const { data } = await this.http.post(":generateContent", payload);
      const candidate = data?.candidates?.[0];
      const text =
        candidate?.content?.parts
          ?.map((part: { text?: string }) => part.text ?? "")
          .join("") ?? "";

      if (!text) {
        const finishReason = candidate?.finishReason;
        const blockReason = data?.promptFeedback?.blockReason;
        const detail = [finishReason && `finishReason=${finishReason}`, blockReason && `blockReason=${blockReason}`]
          .filter(Boolean)
          .join(", ");
        throw new Error(`Gemini API returned empty response${detail ? ` (${detail})` : ""}`);
      }

      // Detect truncation explicitly so callers can react/log instead of
      // silently saving a half-finished JSON.
      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        console.warn(
          `[Gemini] Response finished with reason=${candidate.finishReason} (model=${this.model}, maxOutputTokens=${maxOutputTokens}). Output may be truncated.`
        );
      }

      return text.trim();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? error?.message ?? "Gemini request failed";
      throw new Error(`GeminiService error: ${message}`);
    }
  }

  /** Gemini 2.5 family supports thinkingConfig; older 1.x/2.0 ignore it. */
  private supportsThinkingConfig(): boolean {
    return /gemini-2\.5/i.test(this.model);
  }
}

export const geminiService = new GeminiService();
