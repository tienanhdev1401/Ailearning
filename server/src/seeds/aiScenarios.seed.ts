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
    path.resolve(__dirname, "data", filename),
    path.resolve(process.cwd(), "src", "seeds", "data", filename),
    path.resolve(process.cwd(), "dist", "seeds", "data", filename),
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

  if (existing === 0) {
    const entities = defaultScenarios.map((scenario) =>
      repo.create({
        title: scenario.title,
        description: scenario.description,
        prompt: scenario.prompt,
        language: scenario.language ?? "en",
        difficulty: scenario.difficulty ?? null,
        scenarioKey: scenario.scenarioKey ?? null,
        isCustom: false,
        createdBy: null,
      })
    );

    await repo.save(entities);
    console.log(`🌟 Seeded ${entities.length} AI chat scenarios`);
    return;
  }

  // Backfill scenarioKey on existing seeded rows (rows without scenarioKey only).
  const missingKey = await repo
    .createQueryBuilder("s")
    .where("s.scenarioKey IS NULL AND s.isCustom = :isCustom", { isCustom: false })
    .getMany();

  if (missingKey.length === 0) return;

  let updated = 0;
  for (const row of missingKey) {
    const seed = defaultScenarios.find((s) => s.title === row.title);
    if (seed?.scenarioKey) {
      row.scenarioKey = seed.scenarioKey;
      updated++;
    }
  }
  if (updated > 0) {
    await repo.save(missingKey);
    console.log(`🌟 Backfilled scenarioKey for ${updated} AI scenarios`);
  }
}
