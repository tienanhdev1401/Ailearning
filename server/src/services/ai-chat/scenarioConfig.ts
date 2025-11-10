import fs from "fs";
import path from "path";

export type ScenarioKey = string;

export interface ScenarioGuidance {
  persona: string;
  tone: string;
  focus: string;
  opening: string;
  progression: string;
  closing: string;
  maxUserTurns: number;
}

export interface ScenarioFallbacks {
  opening?: string;
  followUps: string[];
}

interface ScenarioDefinition {
  key: ScenarioKey;
  keywords: string[];
  guidance: ScenarioGuidance;
  fallbacks: ScenarioFallbacks;
}

interface ScenarioConfigFile {
  defaultScenario: ScenarioDefinition;
  scenarios: ScenarioDefinition[];
}

const CONFIG_FILENAME = "scenario-config.json";

function loadScenarioConfig(): ScenarioConfigFile {
  const candidatePaths = [
    path.resolve(__dirname, "config", CONFIG_FILENAME),
    path.resolve(process.cwd(), "src", "services", "ai-chat", "config", CONFIG_FILENAME),
    path.resolve(process.cwd(), "dist", "services", "ai-chat", "config", CONFIG_FILENAME),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      return JSON.parse(raw) as ScenarioConfigFile;
    }
  }

  throw new Error(`Unable to locate scenario config file (${CONFIG_FILENAME}). Checked paths: ${candidatePaths.join(", ")}`);
}

const scenarioConfig = loadScenarioConfig();

const scenarioMap = new Map<ScenarioKey, ScenarioDefinition>(
  scenarioConfig.scenarios.map((definition) => [definition.key, definition])
);

const DEFAULT_SCENARIO_KEY = scenarioConfig.defaultScenario.key;

type ScenarioLookup = ScenarioDefinition & { key: ScenarioKey };

function getScenarioDefinition(key: ScenarioKey): ScenarioLookup {
  if (scenarioMap.has(key)) {
    return scenarioMap.get(key)!;
  }
  if (key === scenarioConfig.defaultScenario.key) {
    return scenarioConfig.defaultScenario;
  }
  return scenarioConfig.defaultScenario;
}

export function resolveScenarioKey(titleOrLabel: string, prompt?: string | null): ScenarioKey {
  const haystack = `${titleOrLabel ?? ""} ${prompt ?? ""}`.toLowerCase();

  for (const definition of scenarioConfig.scenarios) {
    const hasKeyword = definition.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      return definition.key;
    }
  }

  return DEFAULT_SCENARIO_KEY;
}

export function getScenarioGuidance(key: ScenarioKey): ScenarioGuidance {
  return getScenarioDefinition(key).guidance;
}

export function getScenarioFallbacks(key: ScenarioKey): ScenarioFallbacks {
  const definition = getScenarioDefinition(key);
  if (definition.fallbacks && definition.fallbacks.followUps?.length) {
    return definition.fallbacks;
  }

  return scenarioConfig.defaultScenario.fallbacks;
}

export function getDefaultScenarioKey(): ScenarioKey {
  return DEFAULT_SCENARIO_KEY;
}

