import fs from "fs";
import path from "path";
import { AppDataSource } from "../config/database";
import { AiPrompt } from "../models/aiPrompt";
import { AiScenarioGuidance } from "../models/aiScenarioGuidance";

/**
 * One-time migration of legacy JSON config into the database.
 *
 * Reads:
 *   - prompt-templates.json    → ai_prompts (feature=ai_chat, keys: opening, followUp)
 *   - scenario-config.json     → ai_scenario_guidance (one row per scenario + default)
 *
 * Also seeds the built-in "evaluation" prompt extracted from
 * `evaluation.service.ts`, so admins can edit it from the dashboard.
 *
 * Idempotent: skipped if either table already has rows.
 */

interface LegacyPromptTemplates {
  opening: { template: string };
  followUp: { template: string };
}

interface LegacyGuidance {
  persona: string;
  tone: string;
  focus: string;
  opening: string;
  progression: string;
  closing: string;
  maxUserTurns: number;
}

interface LegacyFallbacks {
  opening?: string;
  followUps?: string[];
}

interface LegacyScenarioDef {
  key: string;
  keywords?: string[];
  guidance: LegacyGuidance;
  fallbacks?: LegacyFallbacks;
}

interface LegacyScenarioConfig {
  defaultScenario: LegacyScenarioDef;
  scenarios: LegacyScenarioDef[];
}

const FEATURE_AI_CHAT = "ai_chat";

export const EVALUATION_TEMPLATE = `You are an English pronunciation and conversation tutor. Evaluate the learner's performance across the following dimensions: Pronunciation, Prosody (intonation & fluency), Grammar, Vocabulary.

Use the objective pronunciation evidence below (from an acoustic GOP model) as the authoritative input for the Pronunciation and Prosody scores. Translate the GOP 0-100 average into the 0-10 scale roughly as: 80+ -> 8-10, 56-79 -> 5-7, below 56 -> 0-4. If no pronunciation evidence is provided, give a neutral 5 for Pronunciation and Prosody and mention this in the summary.

Pronunciation evidence:
{{pronunciationEvidence}}

Return a JSON object containing numeric scores from 0 to 10 for each dimension using whole or half steps, a short summary (2-3 sentences) and an array of actionable suggestions. Use camelCase field names.

Conversation transcript:
{{transcript}}`;

function loadJson<T>(filename: string): T | null {
  const candidates = [
    path.resolve(__dirname, "data", filename),
    path.resolve(process.cwd(), "src", "seeds", "data", filename),
    path.resolve(process.cwd(), "dist", "seeds", "data", filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, "utf8")) as T;
    }
  }
  return null;
}

export async function seedAiPromptsAndGuidance() {
  const promptRepo = AppDataSource.getRepository(AiPrompt);
  const guidanceRepo = AppDataSource.getRepository(AiScenarioGuidance);

  // ---- Prompts ----
  if ((await promptRepo.count()) === 0) {
    const legacy = loadJson<LegacyPromptTemplates>("prompt-templates.json");
    const rows: AiPrompt[] = [];

    if (legacy?.opening?.template) {
      rows.push(
        promptRepo.create({
          feature: FEATURE_AI_CHAT,
          key: "opening",
          name: "AI Chat — Opening",
          description: "Generates the AI's first message that opens a role-play.",
          template: legacy.opening.template,
          variables: JSON.stringify([
            "persona",
            "tone",
            "scenarioPrompt",
            "extraFocus",
            "openingObjective",
          ]),
          provider: "gemini",
          model: null,
          temperature: 0.7,
          topP: null,
          maxOutputTokens: 600,
          isActive: true,
        })
      );
    }

    if (legacy?.followUp?.template) {
      rows.push(
        promptRepo.create({
          feature: FEATURE_AI_CHAT,
          key: "followUp",
          name: "AI Chat — Follow-up reply",
          description: "Generates each subsequent AI reply during a role-play.",
          template: legacy.followUp.template,
          variables: JSON.stringify([
            "persona",
            "tone",
            "focus",
            "progression",
            "scenarioBrief",
            "historyLines",
            "latestUserText",
            "userTurnCount",
            "learnerWantsToClose",
            "closureDirective",
            "avoidRepetitionInstruction",
          ]),
          provider: "gemini",
          model: null,
          temperature: 0.68,
          topP: 0.85,
          maxOutputTokens: 220,
          isActive: true,
        })
      );
    }

    rows.push(
      promptRepo.create({
        feature: FEATURE_AI_CHAT,
        key: "evaluation",
        name: "AI Chat — Evaluation",
        description: "Scores the learner's conversation across pronunciation, prosody, grammar and vocabulary.",
        template: EVALUATION_TEMPLATE,
        variables: JSON.stringify(["transcript", "pronunciationEvidence"]),
        provider: "gemini",
        model: null,
        temperature: 0.3,
        topP: null,
        maxOutputTokens: 1500,
        isActive: true,
      })
    );

    if (rows.length) {
      await promptRepo.save(rows);
      console.log(`🌟 Seeded ${rows.length} AI prompts`);
    }
  }

  // ---- Scenario guidance ----
  if ((await guidanceRepo.count()) === 0) {
    const legacy = loadJson<LegacyScenarioConfig>("scenario-config.json");
    if (!legacy) return;

    const all: AiScenarioGuidance[] = [];

    const buildRow = (def: LegacyScenarioDef, isDefault: boolean) =>
      guidanceRepo.create({
        scenarioKey: def.key,
        name: isDefault ? "Default" : def.key.replace(/_/g, " "),
        description: null,
        keywords: JSON.stringify(def.keywords ?? []),
        persona: def.guidance.persona,
        tone: def.guidance.tone,
        focus: def.guidance.focus,
        opening: def.guidance.opening,
        progression: def.guidance.progression,
        closing: def.guidance.closing,
        maxUserTurns: def.guidance.maxUserTurns ?? 6,
        fallbackOpening: def.fallbacks?.opening ?? null,
        fallbackFollowUps: def.fallbacks?.followUps
          ? JSON.stringify(def.fallbacks.followUps)
          : null,
        isDefault,
      });

    all.push(buildRow(legacy.defaultScenario, true));
    for (const def of legacy.scenarios) {
      all.push(buildRow(def, false));
    }

    await guidanceRepo.save(all);
    console.log(`🌟 Seeded ${all.length} AI scenario guidance rows`);
  }
}
