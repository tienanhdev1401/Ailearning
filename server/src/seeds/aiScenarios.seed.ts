import fs from "fs";
import path from "path";
import { AppDataSource } from "../config/database";
import { AiScenario } from "../models/aiScenario";

interface ScenarioSeed {
  title: string;
  description: string;
  prompt: string;
  language?: string;
  difficulty?: string | null;
  scenarioKey?: string;
}

function loadDefaultScenarios(): ScenarioSeed[] {
  const filename = "default-scenarios.json";
  const candidatePaths = [
    path.resolve(__dirname, "..", "services", "ai-chat", "config", filename),
    path.resolve(process.cwd(), "src", "services", "ai-chat", "config", filename),
    path.resolve(process.cwd(), "dist", "services", "ai-chat", "config", filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      return JSON.parse(raw) as ScenarioSeed[];
    }
  }

  throw new Error(`Cannot locate default scenario seed file (${filename}). Checked paths: ${candidatePaths.join(", ")}`);
}

const defaultScenarios = loadDefaultScenarios();

export async function seedAiScenarios() {
  const repo = AppDataSource.getRepository(AiScenario);
  const existing = await repo.count();
  if (existing > 0) {
    return;
  }

  const entities = defaultScenarios.map((scenario) =>
    repo.create({
      title: scenario.title,
      description: scenario.description,
      prompt: scenario.prompt,
      language: scenario.language ?? "en",
      difficulty: scenario.difficulty ?? null,
      isCustom: false,
      createdBy: null,
    })
  );

  await repo.save(entities);
  console.log(`🌟 Seeded ${entities.length} AI chat scenarios`);
}
