import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export interface DeepgramTranscriptionResult {
  text: string;
  duration?: number;
  confidence?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
}

export interface DeepgramSynthesisResult {
  audioBase64: string;
  mimeType: string;
  voice: string;
}

class DeepgramService {
  private readonly apiKey?: string;
  private readonly endpoint: string;
  private readonly model: string;
  private readonly ttsEndpoint: string;
  private readonly ttsVoice: string;
  private readonly ttsFormat: string;

  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY;
    this.endpoint = process.env.DEEPGRAM_API_URL ?? "https://api.deepgram.com/v1/listen";
    this.model = process.env.DEEPGRAM_MODEL ?? "nova-2";
    this.ttsEndpoint = process.env.DEEPGRAM_TTS_URL ?? "https://api.deepgram.com/v1/speak";
    this.ttsVoice = process.env.DEEPGRAM_TTS_VOICE ?? "aura-asteria-en";
    this.ttsFormat = process.env.DEEPGRAM_TTS_FORMAT ?? "audio/mpeg";
  }

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error("Deepgram API key is not configured. Set DEEPGRAM_API_KEY in environment variables.");
    }
  }

  async transcribe(filePath: string): Promise<DeepgramTranscriptionResult> {
    this.ensureConfigured();

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    try {
      const { data } = await axios.post(this.endpoint, formData, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          ...formData.getHeaders(),
        },
        params: {
          model: this.model,
          smart_format: true,
        },
        maxBodyLength: Infinity,
      });

      const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
      const transcript = alternative?.transcript?.trim();

      if (!transcript) {
        throw new Error("Deepgram response missing transcript");
      }

      const duration = data?.metadata?.duration ? Number(data.metadata.duration) : undefined;

      return {
        text: transcript,
        duration,
        confidence: alternative?.confidence ?? undefined,
        words: Array.isArray(alternative?.words)
          ? alternative.words.map((word: any) => ({
              word: word.word,
              start: Number(word.start ?? 0),
              end: Number(word.end ?? 0),
              confidence: word.confidence !== undefined ? Number(word.confidence) : undefined,
            }))
          : undefined,
      };
    } catch (error: any) {
      const message = error?.response?.data?.error ?? error?.message ?? "Deepgram request failed";
      throw new Error(`DeepgramService error: ${message}`);
    }
  }

  async synthesize(text: string, options?: { voice?: string }): Promise<DeepgramSynthesisResult> {
    this.ensureConfigured();

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Cannot synthesize empty text");
    }

    const voice = options?.voice?.trim() || this.ttsVoice;
    const url = `${this.ttsEndpoint}?model=${encodeURIComponent(voice)}`;

    try {
      const response = await axios.post(url, { text: trimmed }, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: this.ttsFormat,
        },
        responseType: "arraybuffer",
      });

      const mimeType = response.headers["content-type"] ?? this.ttsFormat;
      const buffer = Buffer.from(response.data);

      return {
        audioBase64: buffer.toString("base64"),
        mimeType,
        voice,
      };
    } catch (error: any) {
      const message = error?.response?.data?.error ?? error?.message ?? "Deepgram TTS request failed";
      throw new Error(`DeepgramService TTS error: ${message}`);
    }
  }
}

export const deepgramService = new DeepgramService();
