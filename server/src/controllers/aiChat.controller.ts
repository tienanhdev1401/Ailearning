import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { aiChatService } from "../services/ai-chat/aiChat.service";
import { deepgramService } from "../services/ai-chat/deepgram.service";
import { CreditService } from "../services/credit.service";
import ApiError from "../utils/ApiError";
import AI_CONVERSATION_MODE from "../enums/aiConversationMode.enum";

const creditService = new CreditService();

const getUserId = (req: Request) => (req as any).user?.id as number | undefined;

const requireUserId = (req: Request): number => {
  const userId = getUserId(req);
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }
  return userId;
};

export const listScenarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const scenarios = await aiChatService.listScenarios(userId);
    res.json(scenarios);
  } catch (error) {
    next(error);
  }
};

export const createScenario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const { title, description, prompt, language, difficulty } = req.body;
    const scenario = await aiChatService.createCustomScenario(userId, {
      title,
      description,
      prompt,
      language,
      difficulty,
    });

    res.status(201).json(scenario);
  } catch (error) {
    next(error);
  }
};

export const startSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);

    const {
      scenarioId,
      customTitle,
      customPrompt,
      mode,
      scenarioContext,
      scenarioContextLabel,
      difficultyLevel,
      learnerRoadmapName,
      difficultySource,
    } = req.body;

    // Validate the conversation mode against the supported enum before doing
    // any work so an invalid value never reaches the database layer.
    const resolvedMode = mode ?? AI_CONVERSATION_MODE.TEXT;
    if (!Object.values(AI_CONVERSATION_MODE).includes(resolvedMode)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Invalid mode. Allowed values: ${Object.values(AI_CONVERSATION_MODE).join(", ")}`
      );
    }

    // Check and consume credit
    const hasCredit = await creditService.consumeCredit(userId, "AI_CONVERSATION");
    if (!hasCredit) {
      throw new ApiError(
        StatusCodes.PAYMENT_REQUIRED,
        "You've used all your free credits for today. Upgrade to continue learning without limits."
      );
    }

    const normalizedContext =
      typeof scenarioContext === "string" ? scenarioContext.trim() || undefined : undefined;
    const normalizedContextLabel =
      typeof scenarioContextLabel === "string"
        ? scenarioContextLabel.trim() || undefined
        : undefined;

    const payload = {
      userId,
      scenarioId: scenarioId ? Number(scenarioId) : undefined,
      customTitle,
      customPrompt,
      mode: resolvedMode,
      scenarioContext: normalizedContext,
      scenarioContextLabel: normalizedContextLabel,
      difficultyLevel: typeof difficultyLevel === "string" ? difficultyLevel.trim() || undefined : undefined,
      learnerRoadmapName: typeof learnerRoadmapName === "string" ? learnerRoadmapName.trim() || undefined : undefined,
      difficultySource: typeof difficultySource === "string" ? difficultySource.trim() || undefined : undefined,
    };

    try {
      const data = await aiChatService.startConversation(payload);
      res.status(201).json(data);
    } catch (startError) {
      // The credit was already consumed above; refund it so the user is not
      // charged for a session that never started.
      await creditService.refundCredit(userId, "AI_CONVERSATION");
      throw startError;
    }
  } catch (error) {
    next(error);
  }
};

export const postTextMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const text = req.body.text as string;
    const result = await aiChatService.addTextMessage({
      conversationId,
      userId,
      text,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const postAudioMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Audio file is required");
    }

    const result = await aiChatService.addVoiceMessage({
      conversationId,
      userId,
      file,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversations = await aiChatService.listConversations(userId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const result = await aiChatService.deleteConversation(conversationId, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const conversation = await aiChatService.getConversationSnapshot(conversationId, userId);
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

export const completeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const evaluation = await aiChatService.markConversationCompleted(conversationId, userId);
    res.json({ evaluation });
  } catch (error) {
    next(error);
  }
};

export const getEvaluation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = requireUserId(req);
    const conversationId = Number(req.params.id);
    const evaluation = await aiChatService.getEvaluation(conversationId, userId);
    res.json(evaluation);
  } catch (error) {
    next(error);
  }
};

export const synthesizeSpeech = async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireUserId(req);

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const voice = typeof req.body?.voice === "string" ? req.body.voice.trim() : undefined;

    if (!text) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Text is required for speech synthesis");
    }

    const limitedText = text.length > 4000 ? text.slice(0, 4000) : text;
    const result = await deepgramService.synthesize(limitedText, { voice });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
