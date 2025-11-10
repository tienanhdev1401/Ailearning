import { Request, Response } from "express";
import archiver from "archiver";
import path from "path";
import { aiChatService } from "../services/ai-chat/aiChat.service";
import { resolveAudioPath } from "../services/ai-chat/audioStorage.service";
import { deepgramService } from "../services/ai-chat/deepgram.service";
import AI_CONVERSATION_MODE from "../enums/aiConversationMode.enum";

const getUserId = (req: Request) => (req as any).user?.id as number | undefined;

export const listScenarios = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const scenarios = await aiChatService.listScenarios(userId);
    res.json(scenarios);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load scenarios" });
  }
};

export const createScenario = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, description, prompt, language, difficulty } = req.body;
    const scenario = await aiChatService.createCustomScenario(userId, {
      title,
      description,
      prompt,
      language,
      difficulty,
    });

    res.status(201).json(scenario);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to create scenario" });
  }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      scenarioId,
      customTitle,
      customPrompt,
      mode,
      scenarioContext,
      scenarioContextLabel,
    } = req.body;

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
      mode: mode ?? AI_CONVERSATION_MODE.TEXT,
      scenarioContext: normalizedContext,
      scenarioContextLabel: normalizedContextLabel,
    };

    const data = await aiChatService.startConversation(payload);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to start session" });
  }
};

export const postTextMessage = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
    const text = req.body.text as string;
    const result = await aiChatService.addTextMessage({
      conversationId,
      userId,
      text,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to send message" });
  }
};

export const postAudioMessage = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const result = await aiChatService.addVoiceMessage({
      conversationId,
      userId,
      file,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to process audio" });
  }
};

export const getSessionHistory = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
  const conversation = await aiChatService.getConversationSnapshot(conversationId, userId);
    res.json(conversation);
  } catch (error: any) {
    res.status(404).json({ message: error.message ?? "Session not found" });
  }
};

export const completeSession = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
    const evaluation = await aiChatService.markConversationCompleted(conversationId, userId);
    res.json({ evaluation });
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to complete session" });
  }
};

export const getEvaluation = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
    const evaluation = await aiChatService.getEvaluation(conversationId, userId);
    res.json(evaluation);
  } catch (error: any) {
    res.status(404).json({ message: error.message ?? "Evaluation not found" });
  }
};

export const downloadAudioArchive = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationId = Number(req.params.id);
    const files = await aiChatService.gatherAudioFiles(conversationId, userId);

    if (!files.length) {
      return res.status(404).json({ message: "No audio recordings for this session" });
    }

    const zipName = `ai-session-${conversationId}-audio.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=\"${zipName}\"`);

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

  archive.on("error", (err: Error) => {
      res.status(500).end();
      console.error("Archive error", err);
    });

    archive.pipe(res);

    files.forEach((file) => {
      const absolute = resolveAudioPath(file.audioPath);
      const fileName = `${file.id}-${path.basename(file.audioPath)}`;
      archive.file(absolute, { name: fileName });
    });

    archive.finalize();
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to generate archive" });
  }
};

export const synthesizeSpeech = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    const voice = typeof req.body?.voice === "string" ? req.body.voice.trim() : undefined;

    if (!text) {
      return res.status(400).json({ message: "Text is required for speech synthesis" });
    }

    const limitedText = text.length > 4000 ? text.slice(0, 4000) : text;
    const result = await deepgramService.synthesize(limitedText, { voice });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to synthesize speech" });
  }
};
