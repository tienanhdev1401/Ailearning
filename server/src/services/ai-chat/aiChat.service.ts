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
import { uploadRepository } from "../../repositories/upload.repository";
import {
  scenarioGuidanceService,
  GuidanceView,
} from "../ai/scenarioGuidance.service";
import { FEATURE_AI_CHAT, type ScenarioKey } from "./constants";
import { RoadmapEnrollment } from "../../models/roadmapEnrollment";

/** Strip markdown formatting artifacts (*italic*, **bold**, etc.) from AI output. */
function stripMarkdownArtifacts(text: string): string {
  return text
    // **bold** or __bold__
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // *italic* or _italic_
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/(?<=\s|^)_(.+?)_(?=\s|$|[.,!?])/g, "$1")
    // Remove stray markdown heading markers
    .replace(/^#{1,3}\s+/gm, "")
    // Collapse runs of multiple quotation marks into single
    .replace(/"{2,}/g, '"')
    .trim();
}

const FORMAT_RULE = "CRITICAL: Output plain conversational text only. Never use markdown syntax such as asterisks, underscores, hashtags, bold, or italic. Do not wrap words in quotation marks for emphasis. Keep your reply concise and directly useful. Sound natural like a real person, not an AI assistant.";

const RESPONSE_LIMITS: Record<string, { sentences: number; chars: number }> = {
  novice: { sentences: 2, chars: 180 },
  intermediate: { sentences: 3, chars: 260 },
  advanced: { sentences: 4, chars: 380 },
  superior: { sentences: 4, chars: 460 },
  expert: { sentences: 5, chars: 560 },
};

function compactAiReply(text: string, difficultyLevel?: string): string {
  const limit = RESPONSE_LIMITS[difficultyLevel ?? ""] ?? RESPONSE_LIMITS.intermediate;
  const cleaned = stripMarkdownArtifacts(text).replace(/\s+/g, " ").trim();
  if (!cleaned) return cleaned;

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [cleaned];
  let compact = sentences.slice(0, limit.sentences).join(" ").trim();

  if (compact.length <= limit.chars) {
    return compact;
  }

  const sliced = compact.slice(0, limit.chars).trim();
  const lastPunctuation = Math.max(
    sliced.lastIndexOf("."),
    sliced.lastIndexOf("!"),
    sliced.lastIndexOf("?")
  );
  if (lastPunctuation >= Math.floor(limit.chars * 0.55)) {
    return sliced.slice(0, lastPunctuation + 1).trim();
  }

  const lastSpace = sliced.lastIndexOf(" ");
  return `${sliced.slice(0, lastSpace > 40 ? lastSpace : limit.chars).trim()}...`;
}

interface StartConversationPayload {
  userId: number;
  scenarioId?: number;
  customTitle?: string;
  customPrompt?: string;
  mode: AI_CONVERSATION_MODE;
  scenarioContext?: string;
  scenarioContextLabel?: string;
  difficultyLevel?: string;
  learnerRoadmapName?: string;
  difficultySource?: string;
}

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  novice:
    "IMPORTANT LANGUAGE LEVEL: The learner is a COMPLETE BEGINNER. Use only very simple, common words (A1-A2 level). Keep sentences very short (5-8 words). Avoid idioms, phrasal verbs, and complex grammar. Ask only one easy question at a time. Maximum 2 short sentences.",
  intermediate:
    "IMPORTANT LANGUAGE LEVEL: The learner is at INTERMEDIATE level. Use everyday conversational vocabulary (B1 level). Keep sentences moderate length. Ask one focused follow-up question. Avoid highly technical or literary language. Maximum 3 sentences.",
  advanced:
    "IMPORTANT LANGUAGE LEVEL: The learner is at ADVANCED level. Use rich, varied vocabulary (B2-C1 level). Include some phrasal verbs, idioms, and more complex sentence structures. Challenge the learner but remain clear. Maximum 4 sentences.",
  superior:
    "IMPORTANT LANGUAGE LEVEL: The learner is at SUPERIOR level. Use sophisticated vocabulary and complex grammar (C1-C2 level). Include nuanced expressions when relevant. Push the learner's abilities without over-explaining. Maximum 4 sentences.",
  expert:
    "IMPORTANT LANGUAGE LEVEL: The learner is at NATIVE-LIKE level. Speak naturally as you would to a native English speaker. Use colloquialisms, humor, and cultural references when relevant. Maximum 5 sentences.",
};

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
  private enrollmentRepo: Repository<RoadmapEnrollment>;

  constructor() {
    this.scenarioRepo = AppDataSource.getRepository(AiScenario);
    this.conversationRepo = AppDataSource.getRepository(AiConversation);
    this.messageRepo = AppDataSource.getRepository(AiMessage);
    this.evaluationRepo = AppDataSource.getRepository(AiEvaluation);
    this.userRepo = AppDataSource.getRepository(User);
    this.enrollmentRepo = AppDataSource.getRepository(RoadmapEnrollment);
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

    let contextNote = payload.scenarioContext?.trim() || null;
    if (contextNote) {
      contextNote = await this.translateOrEnsureEnglish(contextNote);
    }

    let contextLabel = payload.scenarioContextLabel?.trim() || undefined;
    if (contextLabel) {
      const translatedLabel = await this.translateOrEnsureEnglish(contextLabel);
      contextLabel = translatedLabel || undefined;
    }

    const activeEnrollment = await this.getActiveEnrollmentForDifficulty(payload.userId);
    const activeRoadmapName =
      payload.learnerRoadmapName?.trim() ||
      activeEnrollment?.roadmap?.levelName?.trim() ||
      null;
    const resolvedDifficultyLevel = this.resolveDifficultyLevel(
      payload.difficultyLevel,
      activeRoadmapName
    );
    const difficultyInstruction = DIFFICULTY_INSTRUCTIONS[resolvedDifficultyLevel] ?? "";
    const learnerProfileInstruction = activeRoadmapName
      ? `LEARNER PROFILE: The learner is currently enrolled in "${activeRoadmapName}". Use this only to calibrate difficulty and topic relevance. Do not make a long announcement about it.`
      : "";

    const sessionInstruction = [
      contextNote ? `Learner focus or additional context:\n${contextNote}` : "",
      learnerProfileInstruction,
      difficultyInstruction,
    ].filter(Boolean).join("\n\n");

    const appliedPrompt = [basePrompt, sessionInstruction].filter(Boolean).join("\n\n");

    const conversation = this.conversationRepo.create({
      user,
      scenario,
      customTitle: scenario ? null : payload.customTitle ?? "Custom scenario",
      customPrompt: scenario ? (sessionInstruction || null) : appliedPrompt,
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
        contextLabel: contextLabel ?? scenario?.title ?? conversation.customTitle ?? undefined,
        scenarioKey,
        difficultyLevel: resolvedDifficultyLevel,
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

    const aiMessage = await this.processUserTurnAndGetAiReply(conversation, userMessage);

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

    // Start the Cloudinary upload immediately. It only needs the raw buffer
    // and its result (audioPath) is not required to generate the AI reply, so
    // we let it run concurrently with transcription + scoring and await it
    // just before persisting the message. This overlaps the upload latency
    // instead of adding it sequentially. Errors must not break the turn.
    const uploadPromise: Promise<string | null> = uploadRepository
      .uploadAudio(buffer, filename)
      .catch((error) => {
        console.warn(
          `[AiChat] Failed to upload voice recording for conversation ${conversation.id}:`,
          error instanceof Error ? error.message : error
        );
        return null;
      });

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

    // Await the recording upload that was kicked off earlier (runs
    // concurrently with transcription + scoring above).
    const audioPath = await uploadPromise;

    const userMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.USER,
      content: transcriptText,
      transcript: transcriptText,
      durationSeconds: transcription.duration ?? null,
      audioPath,
      pronunciationScore: pronunciationScoreJson,
    });
    await this.messageRepo.save(userMessage);

    // Emit transcript event for voice messages (real-time UI feedback).
    emitAiChatEvent(conversation.id, "transcript", {
      conversationId: conversation.id,
      messageId: userMessage.id,
      text: transcriptText,
      duration: transcription.duration ?? null,
    });

    const aiMessage = await this.processUserTurnAndGetAiReply(conversation, userMessage);

    return {
      userMessage: this.toMessagePayload(userMessage),
      aiMessage: this.toMessagePayload(aiMessage),
      evaluation: null,
      transcription,
    };
  }

  async markConversationCompleted(conversationId: number, userId: number) {
    const conversation = await this.assertConversationOwner(conversationId, userId);

    // Guard against double-completion: if the session is already completed,
    // return the existing evaluation instead of re-running the scoring and
    // Gemini pipeline (which costs API calls and would overwrite results).
    if (conversation.status === AI_CONVERSATION_STATUS.COMPLETED) {
      const existing = await this.evaluationRepo.findOne({
        where: { conversation: { id: conversation.id } },
        relations: ["conversation"],
      });
      return this.toEvaluationPayload(existing ?? null);
    }

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

  async listConversations(userId: number) {
    // Load conversation rows + scenario only. Message count and the presence
    // of an evaluation are mapped via COUNT subqueries so we never hydrate
    // message/evaluation rows just to summarise them.
    const conversations = await this.conversationRepo
      .createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.scenario", "scenario")
      .loadRelationCountAndMap("conversation.messageCount", "conversation.messages")
      .addSelect(
        `(SELECT COUNT(*) > 0 FROM ai_evaluations eval WHERE eval.conversationId = conversation.id)`,
        "hasEvaluation"
      )
      .where("conversation.user = :userId", { userId })
      .orderBy("conversation.createdAt", "DESC")
      .getRawAndEntities();

    const conversationEntities = conversations.entities;
    if (conversationEntities.length === 0) {
      return [];
    }

    // Build a lookup for the hasEvaluation subquery result from raw rows.
    const evaluationMap = new Map<number, boolean>();
    conversations.raw.forEach((raw: any) => {
      const convId = Number(raw.conversation_id);
      evaluationMap.set(convId, Boolean(Number(raw.hasEvaluation)));
    });

    // Fetch only the lightweight columns needed for the preview of the most
    // recent message per listed conversation, then reduce in memory. This
    // avoids hydrating full AiMessage entities (longtext pronunciation data,
    // audio paths, etc.).
    const conversationIds = conversationEntities.map((conversation) => conversation.id);
    const previewRows = await this.messageRepo
      .createQueryBuilder("message")
      .select([
        "message.id",
        "message.content",
        "message.transcript",
        "message.createdAt",
      ])
      .addSelect("message.conversationId", "message_conversationId")
      .where("message.conversationId IN (:...conversationIds)", { conversationIds })
      .orderBy("message.conversationId", "ASC")
      .addOrderBy("message.createdAt", "DESC")
      .getRawAndEntities();

    // Keep the first (most recent) message seen per conversation.
    const lastMessageByConversation = new Map<number, AiMessage>();
    previewRows.raw.forEach((raw: any, index: number) => {
      const conversationId = Number(raw.message_conversationId);
      if (!lastMessageByConversation.has(conversationId)) {
        lastMessageByConversation.set(conversationId, previewRows.entities[index]);
      }
    });

    return conversationEntities.map((conversation) => {
      const lastMessage = lastMessageByConversation.get(conversation.id) ?? null;
      const messageCount = (conversation as any).messageCount ?? 0;
      const hasEvaluation = evaluationMap.get(conversation.id) ?? false;

      return {
        id: conversation.id,
        title:
          conversation.scenario?.title ??
          conversation.customTitle ??
          "Cuộc trò chuyện",
        scenarioTitle: conversation.scenario?.title ?? null,
        mode: conversation.mode,
        status: conversation.status,
        messageCount,
        lastMessagePreview: lastMessage
          ? this.truncateText(
              (lastMessage.transcript ?? lastMessage.content ?? "").replace(/[\r\n]+/g, " "),
              120
            )
          : null,
        hasEvaluation,
        endedAt: conversation.endedAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });
  }

  async getConversationWithMessages(conversationId: number, userId: number) {
    // assertConversationOwner already loads the owner, scenario and
    // DB-ordered messages in a single query; reuse it instead of issuing a
    // second near-identical query. It also enforces ownership.
    const conversation = await this.assertConversationOwner(conversationId, userId);

    // assertConversationOwner does not load the evaluation relation, so attach
    // it explicitly here for callers that need it (snapshot / evaluation
    // lookups). Loading it unconditionally avoids relying on TypeORM leaving
    // the property `undefined` when a relation is not requested.
    conversation.evaluation = await this.evaluationRepo.findOne({
      where: { conversation: { id: conversation.id } },
    });

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

  /**
   * Delete a conversation and best-effort remove any stored voice recordings
   * from Cloudinary so they do not linger as orphaned files. Messages are
   * removed via the cascade/onDelete on the AiMessage relation.
   */
  async deleteConversation(conversationId: number, userId: number) {
    const conversation = await this.assertConversationOwner(conversationId, userId);

    const audioPaths = (conversation.messages ?? [])
      .map((message) => message.audioPath)
      .filter((path): path is string => Boolean(path));

    await Promise.all(
      audioPaths.map(async (path) => {
        try {
          await uploadRepository.deleteAudio(path);
        } catch (error) {
          // Best-effort: a failed Cloudinary delete must not block DB removal.
          console.warn(
            `[AiChat] Failed to delete Cloudinary audio ${path}:`,
            error instanceof Error ? error.message : error
          );
        }
      })
    );

    await this.conversationRepo.remove(conversation);
    return { id: conversationId, deleted: true };
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
      // Load messages + scenario so callers (text/voice turns) can build the
      // follow-up prompt with full history from this single query, instead of
      // reloading the conversation again afterwards.
      relations: ["user", "scenario", "messages"],
      order: { messages: { createdAt: "ASC" } },
    });

    if (!conversation || conversation.user.id !== userId) {
      throw new Error("Conversation not found or access denied");
    }

    conversation.messages = conversation.messages ?? [];

    return conversation;
  }

  /**
   * Shared logic for both text and voice messages:
   * emit user message → fetch updated history → generate AI follow-up → save & emit AI reply.
   */
  private async processUserTurnAndGetAiReply(
    conversation: AiConversation,
    userMessage: AiMessage,
  ): Promise<AiMessage> {
    emitAiChatEvent(conversation.id, "user_message", this.toMessagePayload(userMessage));

    // Reuse the conversation we already loaded and append the freshly saved
    // user message, instead of reloading the entire conversation on each turn.
    const updatedConversation = conversation;
    updatedConversation.messages = [
      ...(conversation.messages ?? []),
      userMessage,
    ];
    const userText = userMessage.transcript ?? userMessage.content;
    const aiResponseText = await this.generateFollowUp(updatedConversation, userText);

    const aiMessage = this.messageRepo.create({
      conversation,
      role: AI_MESSAGE_ROLE.AI,
      content: aiResponseText,
    });
    await this.messageRepo.save(aiMessage);
    emitAiChatEvent(conversation.id, "ai_message", this.toMessagePayload(aiMessage));

    return aiMessage;
  }

  private async generateOpeningLine(options: { prompt: string; scenarioTitle?: string; contextNote?: string | null; contextLabel?: string; scenarioKey: ScenarioKey; difficultyLevel?: string; }) {
    const { prompt, scenarioTitle, contextNote, contextLabel, scenarioKey, difficultyLevel } = options;
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
        formatRule: FORMAT_RULE,
      },
      "opening"
    );

    const fallback = this.buildFallbackOpening(guidance, scenarioTitle, contextLabel);

    try {
      const response = await geminiService.generate({
        prompt: rendered.text + "\n\n" + FORMAT_RULE,
        temperature: rendered.resolved.config.temperature ?? 0.7,
        topP: rendered.resolved.config.topP ?? undefined,
        maxOutputTokens: rendered.resolved.config.maxOutputTokens ?? 300,
      });

      const trimmed = compactAiReply(response ?? "", difficultyLevel);
      return trimmed.length ? trimmed : compactAiReply(fallback, difficultyLevel);
    } catch (error) {
      console.error("Gemini opening line failed", error);
      return compactAiReply(fallback, difficultyLevel);
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
    const resolvedDifficultyLevel = this.resolveDifficultyLevel(undefined, scenarioBrief);
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
        formatRule: FORMAT_RULE,
      },
      "followUp"
    );
    const fallback = this.buildFollowUpFallback(conversation, latestUserText, guidance, resolvedDifficultyLevel);

    try {
      const response = await geminiService.generate({
        prompt: rendered.text + "\n\n" + FORMAT_RULE,
        temperature: rendered.resolved.config.temperature ?? 0.68,
        topP: rendered.resolved.config.topP ?? 0.85,
        maxOutputTokens: rendered.resolved.config.maxOutputTokens ?? 400,
      });

      const trimmed = compactAiReply(response ?? "", resolvedDifficultyLevel);
      if (trimmed?.length) {
        return trimmed;
      }
      console.warn(
        `[AiChat] Gemini follow-up returned empty for conversation ${conversation.id}. Using fallback.`
      );
      return compactAiReply(fallback, resolvedDifficultyLevel);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[AiChat] Gemini follow-up failed for conversation ${conversation.id}: ${message}`
      );
      return compactAiReply(fallback, resolvedDifficultyLevel);
    }
  }

  private buildFollowUpFallback(_conversation: AiConversation, latestUserText: string, guidance: GuidanceView, difficultyLevel?: string) {
    const trimmedLatest = latestUserText.replace(/[\r\n]+/g, " ").trim();

    if (!trimmedLatest) {
      return compactAiReply("Could you tell me a bit more so we can keep the conversation moving?", difficultyLevel);
    }

    // Use scenario guidance fallbacks from database only. No hardcoded templates.
    if (guidance.fallbackFollowUps?.length) {
      const userTurns = _conversation.messages.filter(
        (m) => m.role === AI_MESSAGE_ROLE.USER
      ).length;
      const jitter = Math.floor(Math.random() * guidance.fallbackFollowUps.length);
      const index = (userTurns + jitter) % guidance.fallbackFollowUps.length;
      return compactAiReply(guidance.fallbackFollowUps[index], difficultyLevel);
    }

    // Ultra-generic fallback when no DB guidance available (should not happen in production)
    return compactAiReply("Thanks for sharing. Could you expand on that a bit more?", difficultyLevel);
  }

  private applyFallbackTemplate(
    template: string | undefined,
    scenarioTitle?: string,
    contextLabel?: string
  ) {
    // No hardcoded default fallback. If DB doesn't provide template, use ultra-generic.
    const baseTemplate = template?.trim?.() || "Hello! Let's begin. Could you introduce yourself?";
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

  private async getActiveEnrollmentForDifficulty(userId: number) {
    return this.enrollmentRepo.findOne({
      where: { user: { id: userId }, status: "active" },
      relations: ["roadmap"],
      order: { started_at: "DESC" },
    });
  }

  private resolveDifficultyLevel(requestedLevel?: string, roadmapName?: string | null) {
    const normalizedRequested = requestedLevel?.trim().toLowerCase();
    if (normalizedRequested && DIFFICULTY_INSTRUCTIONS[normalizedRequested]) {
      return normalizedRequested;
    }

    const source = (roadmapName ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (!source) {
      return "intermediate";
    }

    if (
      source.includes("complete beginner") ||
      source.includes("zero") ||
      source.includes("starter") ||
      source.includes("newbie") ||
      source.includes("a1") ||
      source.includes("300")
    ) {
      return "novice";
    }

    if (
      source.includes("expert") ||
      source.includes("native") ||
      source.includes("c2") ||
      source.includes("950") ||
      source.includes("990")
    ) {
      return "expert";
    }

    if (
      source.includes("superior") ||
      source.includes("c1") ||
      source.includes("850") ||
      source.includes("900")
    ) {
      return "superior";
    }

    if (
      source.includes("advanced") ||
      source.includes("b2") ||
      source.includes("700") ||
      source.includes("750") ||
      source.includes("800")
    ) {
      return "advanced";
    }

    return "intermediate";
  }

  private async translateOrEnsureEnglish(text: string): Promise<string> {
    // Optimization: If the input is already purely English characters, bypass Gemini translation.
    const isPureEnglish = /^[a-zA-Z0-9\s,.\-()]+$/.test(text);
    if (isPureEnglish) {
      return text;
    }

    try {
      const response = await geminiService.generate({
        prompt: `Translate the following text to English. If it contains non-English words or phrases, translate them to appropriate English. Keep the structure and tone of the original sentence as much as possible, but ensure the vocabulary is entirely English. If the text is already completely in English, return it exactly as is, without any modifications. Do not add any conversational filler, notes, markdown formatting, or quotation marks. Return ONLY the translated or original text.\n\nText: "${text}"`,
        temperature: 0.1,
        maxOutputTokens: 150,
      });
      return response.trim().replace(/^"|"$/g, "");
    } catch (error) {
      console.warn("Failed to translate context to English:", error);
      return text;
    }
  }
}

export const aiChatService = new AiChatService();
