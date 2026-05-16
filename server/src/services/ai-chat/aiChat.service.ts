import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AiScenario } from "../../models/aiScenario";
import { AiConversation } from "../../models/aiConversation";
import { AiMessage } from "../../models/aiMessage";
import { AiEvaluation } from "../../models/aiEvaluation";
import AI_CONVERSATION_MODE from "../../enums/aiConversationMode.enum";
import AI_CONVERSATION_STATUS from "../../enums/aiConversationStatus.enum";
import AI_MESSAGE_ROLE from "../../enums/aiMessageRole.enum";
import { geminiService } from "./gemini.service";
import { evaluationService } from "./evaluation.service";
import { pronunciationService } from "./pronunciation.service";
import { User } from "../../models/user";
import { emitAiChatEvent } from "../../socket";
import { deepgramService } from "./deepgram.service";
import type { DeepgramTranscriptionResult } from "./deepgram.service";
import { promptService } from "../ai/prompt.service";
import {
  scenarioGuidanceService,
  GuidanceView,
} from "../ai/scenarioGuidance.service";

const FEATURE_AI_CHAT = "ai_chat";
type ScenarioKey = string;

interface StartConversationPayload {
  userId: number;
  scenarioId?: number;
  customTitle?: string;
  customPrompt?: string;
  mode: AI_CONVERSATION_MODE;
  scenarioContext?: string;
  scenarioContextLabel?: string;
}

interface TextMessagePayload {
  conversationId: number;
  userId: number;
  text: string;
}

interface VoiceMessagePayload {
  conversationId: number;
  userId: number;
  file: Express.Multer.File;
}

export class AiChatService {
  private scenarioRepo: Repository<AiScenario>;
  private conversationRepo: Repository<AiConversation>;
  private messageRepo: Repository<AiMessage>;
  private evaluationRepo: Repository<AiEvaluation>;
  private userRepo: Repository<User>;

  constructor() {
    this.scenarioRepo = AppDataSource.getRepository(AiScenario);
    this.conversationRepo = AppDataSource.getRepository(AiConversation);
    this.messageRepo = AppDataSource.getRepository(AiMessage);
    this.evaluationRepo = AppDataSource.getRepository(AiEvaluation);
    this.userRepo = AppDataSource.getRepository(User);
  }

  async listScenarios(userId: number) {
    return this.scenarioRepo.find({
      where: [
        { isCustom: false },
        { createdBy: { id: userId } },
      ],
      relations: ["createdBy"],
      order: { createdAt: "ASC" },
    });
  }

  async createCustomScenario(userId: number, data: { title: string; description: string; prompt: string; language?: string; difficulty?: string; }) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new Error("User not found");
    }

    const scenario = this.scenarioRepo.create({
      title: data.title,
      description: data.description,
      prompt: data.prompt,
      difficulty: data.difficulty ?? null,
      language: data.language ?? "en",
      isCustom: true,
      createdBy: user,
    });

    return this.scenarioRepo.save(scenario);
  }

  async startConversation(payload: StartConversationPayload) {
    const user = await this.userRepo.findOneBy({ id: payload.userId });
    if (!user) {
      throw new Error("User not found");
    }

    let scenario: AiScenario | null = null;
    if (payload.scenarioId) {
      scenario = await this.scenarioRepo.findOneBy({ id: payload.scenarioId });
      if (!scenario) {
        throw new Error("Scenario not found");
      }
    }

    const basePrompt = scenario?.prompt ?? payload.customPrompt;
    if (!basePrompt) {
      throw new Error("Scenario prompt is required");
    }

    const contextNote = payload.scenarioContext?.trim() || null;
    const appliedPrompt = contextNote ? `${basePrompt}

Learner focus or additional context:
${contextNote}` : basePrompt;

    const conversation = this.conversationRepo.create({
      user,
      scenario,
      customTitle: scenario ? null : payload.customTitle ?? "Custom scenario",
      customPrompt: scenario ? (contextNote ?? null) : appliedPrompt,
      mode: payload.mode,
      status: AI_CONVERSATION_STATUS.ACTIVE,
    });

    const saved = await this.conversationRepo.save(conversation);

    let openingMessage: AiMessage | null = null;
    try {
      const scenarioKey = scenario?.scenarioKey
        ?? (await scenarioGuidanceService.resolveKeyFromText(
          `${scenario?.title ?? conversation.customTitle ?? ""} ${appliedPrompt}`
        ));
      const openingText = await this.generateOpeningLine({
        prompt: appliedPrompt,
        scenarioTitle: scenario?.title ?? conversation.customTitle ?? undefined,
        contextNote,
        contextLabel: payload.scenarioContextLabel ?? scenario?.title ?? conversation.customTitle ?? undefined,
        scenarioKey,
      });
      openingMessage = this.messageRepo.create({
        conversation: saved,
        role: AI_MESSAGE_ROLE.AI,
        content: openingText,
      });
      await this.messageRepo.save(openingMessage);
    } catch (error) {
      console.error("Failed to create opening message", error);
    }

    const snapshot = await this.getConversationSnapshot(saved.id, user.id);

    return {
      conversation: snapshot,
      openingMessage: openingMessage ? this.toMessagePayload(openingMessage) : null,
    };
  }

  async addTextMessage(payload: TextMessagePayload) {
    const conversation = await this.assertConversationOwner(payload.conversationId, payload.userId);
    const trimmed = payload.text.trim();
    if (!trimmed) {
      throw new Error("Message is empty");
    }

    const userMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.USER,
      content: trimmed,
      transcript: trimmed,
    });
    await this.messageRepo.save(userMessage);
    emitAiChatEvent(conversation.id, "user_message", this.toMessagePayload(userMessage));

  const updatedConversation = await this.getConversationWithMessages(conversation.id, payload.userId);
  const aiResponseText = await this.generateFollowUp(updatedConversation, trimmed);

    const aiMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.AI,
      content: aiResponseText,
    });
    await this.messageRepo.save(aiMessage);
    emitAiChatEvent(conversation.id, "ai_message", this.toMessagePayload(aiMessage));

    // Overall evaluation is now produced only once the learner ends the
    // session (see markConversationCompleted). Per-turn evaluation is skipped
    // to save Gemini quota and avoid noisy mid-session score fluctuation.
    return {
      userMessage: this.toMessagePayload(userMessage),
      aiMessage: this.toMessagePayload(aiMessage),
      evaluation: null,
    };
  }

  async addVoiceMessage(payload: VoiceMessagePayload) {
    const conversation = await this.assertConversationOwner(payload.conversationId, payload.userId);

    const buffer = payload.file.buffer;
    if (!buffer || buffer.length === 0) {
      throw new Error("Chúng tôi chưa thu được âm thanh trong bản ghi. Bạn hãy thử nói rõ hơn và giữ nút lâu hơn một chút nhé.");
    }

    const filename = payload.file.originalname || `turn-${Date.now()}.wav`;
    const contentType = payload.file.mimetype || "audio/wav";

    let transcription: DeepgramTranscriptionResult;
    try {
      transcription = await deepgramService.transcribeBuffer(buffer, {
        contentType,
        filename,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[AiChat] Voice transcription failed: ${message}`);
      throw new Error("Hệ thống chưa nhận rõ giọng nói của bạn. Hãy thử ghi âm lại nhé.");
    }

    const transcriptText = transcription.text?.trim();
    if (!transcriptText) {
      throw new Error("Chưa nhận được nội dung từ ghi âm. Bạn có thể thử nói lại to và rõ hơn không?");
    }

    // Score this turn against W2V_GOP using the in-memory buffer.
    let pronunciationScoreJson: string | null = null;
    try {
      const turnScore = await pronunciationService.scoreTurn({
        text: transcriptText,
        audio: buffer,
        filename,
        contentType,
      });
      pronunciationScoreJson = JSON.stringify(turnScore);
    } catch (error) {
      console.warn(
        `[AiChat] Pronunciation scoring failed for conversation ${conversation.id}:`,
        error instanceof Error ? error.message : error
      );
    }

    const userMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.USER,
      content: transcriptText,
      transcript: transcriptText,
      durationSeconds: transcription.duration ?? null,
      audioPath: null,
      pronunciationScore: pronunciationScoreJson,
    });
    await this.messageRepo.save(userMessage);
    emitAiChatEvent(conversation.id, "user_message", this.toMessagePayload(userMessage));
    emitAiChatEvent(conversation.id, "transcript", {
      conversationId: conversation.id,
      messageId: userMessage.id,
      text: transcriptText,
      duration: transcription.duration ?? null,
    });

  const updatedConversation = await this.getConversationWithMessages(conversation.id, payload.userId);
  const aiResponseText = await this.generateFollowUp(updatedConversation, transcriptText);

    const aiMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.AI,
      content: aiResponseText,
    });
    await this.messageRepo.save(aiMessage);
    emitAiChatEvent(conversation.id, "ai_message", this.toMessagePayload(aiMessage));

    // Overall evaluation runs only at session end. Per-turn pronunciation
    // scoring already happened above via pronunciationService.scoreTurn and
    // is cached on the message row for the end-of-session aggregation.
    return {
      userMessage: this.toMessagePayload(userMessage),
      aiMessage: this.toMessagePayload(aiMessage),
      evaluation: null,
      transcription,
    };
  }

  async markConversationCompleted(conversationId: number, userId: number) {
    const conversation = await this.assertConversationOwner(conversationId, userId);
    conversation.status = AI_CONVERSATION_STATUS.COMPLETED;
    conversation.endedAt = new Date();
    await this.conversationRepo.save(conversation);

    // Build the per-turn pronunciation report FIRST so its evidence (avg
    // score, weak phones/words) can be injected into the Gemini overall
    // evaluation prompt below.
    let pronunciationReport: Awaited<ReturnType<typeof pronunciationService.buildReport>> | null = null;
    try {
      pronunciationReport = await pronunciationService.buildReport(conversation.id);
    } catch (error) {
      console.error("Pronunciation analysis failed", error);
    }

    let evaluation: AiEvaluation | null = null;
    try {
      evaluation = await evaluationService.evaluateConversation(
        conversation.id,
        pronunciationReport
      );
    } catch (error) {
      console.error("Evaluation failed", error);
    }

    if (pronunciationReport) {
      try {
        const target = evaluation ?? (await this.evaluationRepo.findOne({
          where: { conversation: { id: conversation.id } },
          relations: ["conversation"],
        })) ?? this.evaluationRepo.create({ conversation });
        target.pronunciationReport = JSON.stringify(pronunciationReport);
        evaluation = await this.evaluationRepo.save(target);
      } catch (error) {
        console.error("Persisting pronunciation report failed", error);
      }
    }

    if (evaluation) {
      emitAiChatEvent(conversation.id, "evaluation_update", this.toEvaluationPayload(evaluation));
    }

    return this.toEvaluationPayload(evaluation);
  }

  async getConversationWithMessages(conversationId: number, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, user: { id: userId } },
      relations: [
        "scenario",
        "messages",
        "messages.conversation",
        "evaluation",
      ],
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    conversation.messages = conversation.messages
      ? conversation.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      : [];

    return conversation;
  }

  async getConversationSnapshot(conversationId: number, userId: number) {
    const conversation = await this.getConversationWithMessages(conversationId, userId);

    return {
      id: conversation.id,
      scenario: conversation.scenario
        ? {
            id: conversation.scenario.id,
            title: conversation.scenario.title,
            description: conversation.scenario.description,
            language: conversation.scenario.language,
            difficulty: conversation.scenario.difficulty,
            isCustom: conversation.scenario.isCustom,
          }
        : null,
      customTitle: conversation.customTitle,
      customPrompt: conversation.customPrompt,
      mode: conversation.mode,
      status: conversation.status,
      audioPath: conversation.audioPath,
      endedAt: conversation.endedAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((message) => this.toMessagePayload(message)),
      evaluation: this.toEvaluationPayload(conversation.evaluation ?? null),
    };
  }

  async getEvaluation(conversationId: number, userId: number) {
    const conversation = await this.getConversationWithMessages(conversationId, userId);
    if (!conversation.evaluation) {
      return null;
    }
    return this.toEvaluationPayload(conversation.evaluation);
  }

  private async assertConversationOwner(conversationId: number, userId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ["user"],
    });

    if (!conversation || conversation.user.id !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    return conversation;
  }

  private async generateOpeningLine(options: { prompt: string; scenarioTitle?: string; contextNote?: string | null; contextLabel?: string; scenarioKey: ScenarioKey; }) {
    const { prompt, scenarioTitle, contextNote, contextLabel, scenarioKey } = options;
    const guidance = await scenarioGuidanceService.resolve(scenarioKey);

    // Per-scenario override falls back to the generic "opening" prompt.
    const rendered = await promptService.render(
      FEATURE_AI_CHAT,
      `opening:${guidance.scenarioKey}`,
      {
        persona: guidance.persona,
        tone: guidance.tone,
        scenarioPrompt: prompt,
        extraFocus: contextNote ?? "(no additional context)",
        openingObjective: guidance.opening,
      },
      "opening"
    );

    const fallback = this.buildFallbackOpening(guidance, scenarioTitle, contextLabel);

    try {
      const response = await geminiService.generate({
        prompt: rendered.text,
        temperature: rendered.resolved.config.temperature ?? 0.7,
        topP: rendered.resolved.config.topP ?? undefined,
        maxOutputTokens: rendered.resolved.config.maxOutputTokens ?? 600,
      });

      const trimmed = response?.trim();
      return trimmed?.length ? trimmed : fallback;
    } catch (error) {
      console.error("Gemini opening line failed", error);
      return fallback;
    }
  }

  private buildFallbackOpening(guidance: GuidanceView, scenarioTitle?: string, contextLabel?: string) {
    return this.applyFallbackTemplate(guidance.fallbackOpening ?? undefined, scenarioTitle, contextLabel);
  }

  private async generateFollowUp(conversation: AiConversation, latestUserText: string) {
    const scenarioBriefParts: string[] = [];
    if (conversation.scenario?.prompt) {
      scenarioBriefParts.push(conversation.scenario.prompt);
    }
    if (conversation.customPrompt) {
      scenarioBriefParts.push(conversation.customPrompt);
    }
    const scenarioBrief = scenarioBriefParts.length
      ? scenarioBriefParts.join("\n\n")
      : "(No additional briefing provided.)";
    const orderedMessages = [...conversation.messages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
    const historyLines = orderedMessages
      .map((message) => {
        const speaker = message.role === AI_MESSAGE_ROLE.USER ? "Learner" : "AI";
        return `${speaker}: ${message.transcript ?? message.content}`;
      })
      .join("\n");
    const scenarioKey = conversation.scenario?.scenarioKey
      ?? (await scenarioGuidanceService.resolveKeyFromText(
        `${conversation.scenario?.title ?? conversation.customTitle ?? ""} ${scenarioBrief}`
      ));
    const guidance = await scenarioGuidanceService.resolve(scenarioKey);
    const lastAiSnippet = this.getLastAiSnippet(conversation);
    const userTurnCount = conversation.messages.filter(
      (message) => message.role === AI_MESSAGE_ROLE.USER
    ).length;
    const learnerWantsToClose = this.detectClosureIntent(latestUserText);
    const shouldCloseConversation = learnerWantsToClose || userTurnCount >= guidance.maxUserTurns;
    const avoidRepetitionInstruction = lastAiSnippet
      ? `Keep the wording fresh and do not echo your previous reply where you said: "${lastAiSnippet}".`
      : "Keep the wording fresh and avoid repeating yourself.";

    const closureDirective = shouldCloseConversation
      ? guidance.closing
      : guidance.progression;

    const rendered = await promptService.render(
      FEATURE_AI_CHAT,
      `followUp:${guidance.scenarioKey}`,
      {
        persona: guidance.persona,
        tone: guidance.tone,
        focus: guidance.focus,
        progression: guidance.progression,
        scenarioBrief,
        historyLines: historyLines || "(No conversation history yet.)",
        latestUserText,
        userTurnCount: userTurnCount.toString(),
        learnerWantsToClose: learnerWantsToClose ? "yes" : "no",
        closureDirective,
        avoidRepetitionInstruction,
      },
      "followUp"
    );
    const fallback = this.buildFollowUpFallback(conversation, latestUserText, guidance);

    try {
      const response = await geminiService.generate({
        prompt: rendered.text,
        temperature: rendered.resolved.config.temperature ?? 0.68,
        topP: rendered.resolved.config.topP ?? 0.85,
        maxOutputTokens: rendered.resolved.config.maxOutputTokens ?? 700,
      });

      const trimmed = response?.trim();
      if (trimmed?.length) {
        return trimmed;
      }
      console.warn(
        `[AiChat] Gemini follow-up returned empty for conversation ${conversation.id}. Using fallback.`
      );
      return fallback;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[AiChat] Gemini follow-up failed for conversation ${conversation.id}: ${message}`
      );
      return fallback;
    }
  }

  private buildFollowUpFallback(conversation: AiConversation, latestUserText: string, guidance: GuidanceView) {
    const trimmedLatest = latestUserText.replace(/[\r\n]+/g, " ").trim();

    if (!trimmedLatest) {
      return "Could you tell me a bit more so we can keep the conversation moving?";
    }

    // Echo back a fragment of what the learner said so the fallback does not
    // feel canned even if Gemini fails repeatedly.
    const snippet = trimmedLatest.length > 70
      ? `${trimmedLatest.slice(0, 70).trim()}...`
      : trimmedLatest;

    const fallbackPool = guidance.fallbackFollowUps?.length
      ? guidance.fallbackFollowUps
      : [
          `Interesting — when you mentioned "${snippet}", what made that stand out for you?`,
          `Thanks for sharing. Could you walk me through what happened around "${snippet}"?`,
          `Got it. Tell me more about how "${snippet}" played out — what came next?`,
          `That's useful context. What was the trickiest part of "${snippet}" for you?`,
          `Nice. If you had to do "${snippet}" again, what would you change?`,
        ];

    // Mix in a turn-based offset so consecutive fallbacks don't repeat verbatim,
    // and a small random jitter so refreshing the same turn varies the wording.
    const userTurns = conversation.messages.filter(
      (m) => m.role === AI_MESSAGE_ROLE.USER
    ).length;
    const jitter = Math.floor(Math.random() * fallbackPool.length);
    const index = (userTurns + jitter) % fallbackPool.length;
    return fallbackPool[index];
  }

  private applyFallbackTemplate(
    template: string | undefined,
    scenarioTitle?: string,
    contextLabel?: string
  ) {
    const defaultFallback =
      "Hello! I'm ready to kick off our role-play together. Could you start by introducing yourself so we can dive in?";

    const baseTemplate = template && template.trim().length ? template : defaultFallback;
    const replacements: Record<string, string> = {
      scenarioTitle: scenarioTitle ?? "",
      contextLabel: contextLabel ?? "",
      contextSentence: contextLabel ? ` We're focusing on ${contextLabel}.` : "",
    };

    return baseTemplate.replace(/\{\{(.*?)\}\}/g, (_match, token) => {
      const key = String(token).trim();
      return replacements[key] ?? "";
    });
  }

  private toMessagePayload(message: AiMessage) {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      transcript: message.transcript,
      durationSeconds: message.durationSeconds,
      audioPath: message.audioPath,
      createdAt: message.createdAt,
    };
  }

  private toEvaluationPayload(evaluation: AiEvaluation | null) {
    if (!evaluation) {
      return null;
    }

    let parsedPronunciationReport: unknown = null;
    if (evaluation.pronunciationReport) {
      try {
        parsedPronunciationReport = JSON.parse(evaluation.pronunciationReport);
      } catch (error) {
        parsedPronunciationReport = null;
      }
    }

    return {
      id: evaluation.id,
      pronunciationScore: evaluation.pronunciationScore,
      prosodyScore: evaluation.prosodyScore,
      grammarScore: evaluation.grammarScore,
      vocabularyScore: evaluation.vocabularyScore,
      summary: evaluation.summary,
      rawDetails: evaluation.rawDetails,
      pronunciationReport: parsedPronunciationReport,
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
    };
  }


  private detectClosureIntent(latestUserText: string) {
    const normalized = latestUserText.toLowerCase();
    const phrases = [
      "thank you",
      "thanks",
      "that's all",
      "that is all",
      "i'm done",
      "im done",
      "bye",
      "goodbye",
      "that's enough",
      "that was helpful",
      "got it",
      "appreciate it",
    ];

    return phrases.some((phrase) => normalized.includes(phrase));
  }

  private getLastAiSnippet(conversation: AiConversation) {
    const lastAiMessage = [...conversation.messages]
      .slice()
      .reverse()
      .find((message) => message.role === AI_MESSAGE_ROLE.AI);

    if (!lastAiMessage) {
      return null;
    }

    const raw = lastAiMessage.content ?? lastAiMessage.transcript ?? "";
    return this.truncateText(raw, 160);
  }

  private truncateText(text: string, maxLength: number) {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength - 3)}...`;
  }
}

export const aiChatService = new AiChatService();
