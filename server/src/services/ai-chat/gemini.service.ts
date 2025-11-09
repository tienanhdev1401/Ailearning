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
      maxOutputTokens = 640,
      responseMimeType,
    } = options;

    const generationConfig: Record<string, unknown> = {
      temperature,
      topP,
      maxOutputTokens,
    };

    if (responseMimeType) {
      generationConfig["responseMimeType"] = responseMimeType;
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
      const text =
        data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";

      if (!text) {
        throw new Error("Gemini API returned empty response");
      }

      return text.trim();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? error?.message ?? "Gemini request failed";
      throw new Error(`GeminiService error: ${message}`);
    }
  }
}

export const geminiService = new GeminiService();
