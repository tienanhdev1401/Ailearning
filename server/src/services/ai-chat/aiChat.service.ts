import { Repository } from "typeorm";
import path from "path";
import fs from "fs";
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
import { saveUploadedAudio } from "./audioStorage.service";
import { User } from "../../models/user";
import { emitAiChatEvent } from "../../socket";
import { deepgramService } from "./deepgram.service";
import type { DeepgramTranscriptionResult } from "./deepgram.service";
import { renderPromptTemplate } from "./promptTemplates";
import {
  getDefaultScenarioKey,
  getScenarioFallbacks,
  getScenarioGuidance,
  resolveScenarioKey,
  ScenarioKey,
} from "./scenarioConfig";

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
      const scenarioKey = resolveScenarioKey(
        scenario?.title ?? conversation.customTitle ?? "",
        appliedPrompt
      );
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

    let evaluation: AiEvaluation | null = null;
    try {
      evaluation = await evaluationService.evaluateConversation(conversation.id);
      if (evaluation) {
        emitAiChatEvent(conversation.id, "evaluation_update", evaluation);
      }
    } catch (error) {
      console.error("Evaluation failed", error);
    }

    return {
      userMessage: this.toMessagePayload(userMessage),
      aiMessage: this.toMessagePayload(aiMessage),
      evaluation: this.toEvaluationPayload(evaluation),
    };
  }

  async addVoiceMessage(payload: VoiceMessagePayload) {
    const conversation = await this.assertConversationOwner(payload.conversationId, payload.userId);

    const audioPath = await saveUploadedAudio(conversation.id, payload.file);
    const absolutePath = path.resolve(audioPath);

    try {
      const stats = await fs.promises.stat(absolutePath);
      if (!stats.size) {
        console.warn(`[AiChat] Uploaded audio is empty: ${absolutePath}`);
        throw new Error("Chúng tôi chưa thu được âm thanh trong bản ghi. Bạn hãy thử nói rõ hơn và giữ nút lâu hơn một chút nhé.");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("thu được âm thanh")) {
        throw error;
      }
      console.warn(`[AiChat] Unable to read uploaded audio: ${absolutePath}`, error);
    }

    let transcription: DeepgramTranscriptionResult;
    try {
      transcription = await deepgramService.transcribe(absolutePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[AiChat] Voice transcription failed: ${message}`);
      throw new Error("Hệ thống chưa nhận rõ giọng nói của bạn. Hãy thử ghi âm lại nhé.");
    }

    const transcriptText = transcription.text?.trim();
    if (!transcriptText) {
      throw new Error("Chưa nhận được nội dung từ ghi âm. Bạn có thể thử nói lại to và rõ hơn không?");
    }

    const userMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.USER,
      content: transcriptText,
      transcript: transcriptText,
      durationSeconds: transcription.duration ?? null,
      audioPath,
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

    let evaluation: AiEvaluation | null = null;
    try {
      evaluation = await evaluationService.evaluateConversation(conversation.id);
      if (evaluation) {
        emitAiChatEvent(conversation.id, "evaluation_update", evaluation);
      }
    } catch (error) {
      console.error("Evaluation failed", error);
    }

    return {
      userMessage: this.toMessagePayload(userMessage),
      aiMessage: this.toMessagePayload(aiMessage),
      evaluation: this.toEvaluationPayload(evaluation),
      transcription,
    };
  }

  async markConversationCompleted(conversationId: number, userId: number) {
    const conversation = await this.assertConversationOwner(conversationId, userId);
    conversation.status = AI_CONVERSATION_STATUS.COMPLETED;
    conversation.endedAt = new Date();
    await this.conversationRepo.save(conversation);

    let evaluation: AiEvaluation | null = null;
    try {
      evaluation = await evaluationService.evaluateConversation(conversation.id);
      if (evaluation) {
        emitAiChatEvent(conversation.id, "evaluation_update", evaluation);
      }
    } catch (error) {
      console.error("Evaluation failed", error);
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

  async gatherAudioFiles(conversationId: number, userId: number) {
    const conversation = await this.getConversationWithMessages(conversationId, userId);
    return conversation.messages
      .filter((message) => !!message.audioPath)
      .map((message) => ({
        id: message.id,
        audioPath: message.audioPath!,
        createdAt: message.createdAt,
      }));
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
    const guidance = getScenarioGuidance(scenarioKey);
    const fullPrompt = renderPromptTemplate("opening", {
      persona: guidance.persona,
      tone: guidance.tone,
      scenarioPrompt: prompt,
      extraFocus: contextNote ?? "(no additional context)",
      openingObjective: guidance.opening,
    });

    const fallback = this.buildFallbackOpening(scenarioKey, scenarioTitle, contextLabel);

    try {
      const response = await geminiService.generate({
        prompt: fullPrompt,
        temperature: 0.7,
        maxOutputTokens: 180,
      });

      const trimmed = response?.trim();
      return trimmed?.length ? trimmed : fallback;
    } catch (error) {
      console.error("Gemini opening line failed", error);
      return fallback;
    }
  }

  private buildFallbackOpening(scenarioKey: ScenarioKey, scenarioTitle?: string, contextLabel?: string) {
    const fallback = getScenarioFallbacks(scenarioKey);
    return this.applyFallbackTemplate(fallback.opening, scenarioTitle, contextLabel);
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
    const scenarioKey = resolveScenarioKey(
      conversation.scenario?.title ?? conversation.customTitle ?? "",
      scenarioBrief
    );
    const guidance = getScenarioGuidance(scenarioKey);
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

    const prompt = renderPromptTemplate("followUp", {
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
    });
    const fallback = this.buildFollowUpFallback(conversation, latestUserText, scenarioKey);

    try {
      const response = await geminiService.generate({
        prompt,
        temperature: 0.68,
        topP: 0.85,
        maxOutputTokens: 220,
      });

      const trimmed = response?.trim();
      return trimmed?.length ? trimmed : fallback;
    } catch (error) {
      console.error("Gemini follow-up failed", error);
      return fallback;
    }
  }

  private buildFollowUpFallback(conversation: AiConversation, latestUserText: string, scenarioKey: ScenarioKey) {
    const trimmedLatest = latestUserText.replace(/[\r\n]+/g, " ").trim();

    if (!trimmedLatest) {
      return "Could you tell me a bit more so we can keep the conversation moving?";
    }

    const messageCount = conversation.messages.length;
    const fallbackPool = getScenarioFallbacks(scenarioKey).followUps;
    return fallbackPool[messageCount % fallbackPool.length];
  }

  private applyFallbackTemplate(
    template: string | undefined,
    scenarioTitle?: string,
    contextLabel?: string
  ) {
    const defaultFallback = getScenarioFallbacks(getDefaultScenarioKey()).opening ??
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

    return {
      id: evaluation.id,
      pronunciationScore: evaluation.pronunciationScore,
      prosodyScore: evaluation.prosodyScore,
      grammarScore: evaluation.grammarScore,
      vocabularyScore: evaluation.vocabularyScore,
      summary: evaluation.summary,
      rawDetails: evaluation.rawDetails,
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
