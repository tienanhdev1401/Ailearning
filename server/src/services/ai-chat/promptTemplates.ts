import fs from "fs";
import path from "path";

type PromptTemplateKey = "opening" | "followUp";

interface PromptTemplateEntry {
  template: string;
}

type PromptTemplateConfig = Record<PromptTemplateKey, PromptTemplateEntry>;

const CONFIG_FILENAME = "prompt-templates.json";

function loadPromptTemplates(): PromptTemplateConfig {
  const candidatePaths = [
    path.resolve(__dirname, "config", CONFIG_FILENAME),
    path.resolve(process.cwd(), "src", "services", "ai-chat", "config", CONFIG_FILENAME),
    path.resolve(process.cwd(), "dist", "services", "ai-chat", "config", CONFIG_FILENAME),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, "utf8");
      return JSON.parse(raw) as PromptTemplateConfig;
    }
  }

  throw new Error(`Unable to locate prompt template file (${CONFIG_FILENAME}). Checked paths: ${candidatePaths.join(", ")}`);
}

const templates = loadPromptTemplates();

export function renderPromptTemplate(key: PromptTemplateKey, replacements: Record<string, string>): string {
  const entry = templates[key];
  if (!entry?.template) {
    throw new Error(`Prompt template not found for key: ${key}`);
  }

  return entry.template.replace(/\{\{(.*?)\}\}/g, (_match, token) => {
    const trimmed = String(token).trim();
    return replacements[trimmed] ?? "";
  });
}
