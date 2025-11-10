import { AppDataSource } from "../../config/database";
import { AiConversation } from "../../models/aiConversation";
import { AiEvaluation } from "../../models/aiEvaluation";
import AI_MESSAGE_ROLE from "../../enums/aiMessageRole.enum";
import { geminiService } from "./gemini.service";

interface EvaluationPayload {
  pronunciationScore: number;
  prosodyScore: number;
  grammarScore: number;
  vocabularyScore: number;
  summary: string;
  suggestions?: string[];
}

class EvaluationService {
  async evaluateConversation(conversationId: number): Promise<AiEvaluation> {
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

    const prompt = `You are an English pronunciation and conversation tutor. Evaluate the learner's performance across the following dimensions: Pronunciation, Prosody (intonation & fluency), Grammar, Vocabulary.
Return a JSON object containing numeric scores from 0 to 10 for each dimension using whole or half steps, a short summary (2-3 sentences) and an array of actionable suggestions. Use camelCase field names.

Conversation transcript:
${transcript}`;

    const raw = await geminiService.generate({
      prompt,
      history: [],
      temperature: 0.3,
      responseMimeType: "application/json",
      maxOutputTokens: 512,
    });

    let parsed: EvaluationPayload;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Failed to parse evaluation JSON: ${raw}`);
    }

    const evaluation = conversation.evaluation ?? evaluationRepo.create({ conversation });
    evaluation.pronunciationScore = parsed.pronunciationScore ?? 0;
    evaluation.prosodyScore = parsed.prosodyScore ?? 0;
    evaluation.grammarScore = parsed.grammarScore ?? 0;
    evaluation.vocabularyScore = parsed.vocabularyScore ?? 0;
    evaluation.summary = parsed.summary ?? null;
    evaluation.rawDetails = JSON.stringify(parsed, null, 2);

    return evaluationRepo.save(evaluation);
  }
}

export const evaluationService = new EvaluationService();
