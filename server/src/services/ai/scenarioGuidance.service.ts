import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AiScenarioGuidance } from "../../models/aiScenarioGuidance";

export interface GuidanceView {
  id: number;
  scenarioKey: string;
  name: string;
  description: string | null;
  keywords: string[];
  persona: string;
  tone: string;
  focus: string;
  opening: string;
  progression: string;
  closing: string;
  maxUserTurns: number;
  fallbackOpening: string | null;
  fallbackFollowUps: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const parseJsonArray = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
};

const stringifyOrNull = (value: unknown): string | null => {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((x) => typeof x === "string"));
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return JSON.stringify(parsed.filter((x) => typeof x === "string"));
    } catch {
      /* ignore */
    }
    return null;
  }
  return null;
};

class ScenarioGuidanceService {
  private repo: Repository<AiScenarioGuidance> | null = null;
  private cache = new Map<string, AiScenarioGuidance>();
  private defaultCache: AiScenarioGuidance | null = null;

  private getRepo(): Repository<AiScenarioGuidance> {
    if (!this.repo) {
      this.repo = AppDataSource.getRepository(AiScenarioGuidance);
    }
    return this.repo;
  }

  invalidate() {
    this.cache.clear();
    this.defaultCache = null;
  }

  toView(entity: AiScenarioGuidance): GuidanceView {
    return {
      id: entity.id,
      scenarioKey: entity.scenarioKey,
      name: entity.name,
      description: entity.description,
      keywords: parseJsonArray(entity.keywords),
      persona: entity.persona,
      tone: entity.tone,
      focus: entity.focus,
      opening: entity.opening,
      progression: entity.progression,
      closing: entity.closing,
      maxUserTurns: entity.maxUserTurns,
      fallbackOpening: entity.fallbackOpening,
      fallbackFollowUps: parseJsonArray(entity.fallbackFollowUps),
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async getDefault(): Promise<AiScenarioGuidance | null> {
    if (this.defaultCache) return this.defaultCache;
    const found = await this.getRepo().findOne({ where: { isDefault: true } });
    if (found) this.defaultCache = found;
    return found;
  }

  async findByKey(scenarioKey: string): Promise<AiScenarioGuidance | null> {
    if (this.cache.has(scenarioKey)) return this.cache.get(scenarioKey)!;
    const found = await this.getRepo().findOne({ where: { scenarioKey } });
    if (found) this.cache.set(scenarioKey, found);
    return found;
  }

  /** Resolve guidance, falling back to the default. Throws if no default. */
  async resolve(scenarioKey: string | null | undefined): Promise<GuidanceView> {
    if (scenarioKey) {
      const direct = await this.findByKey(scenarioKey);
      if (direct) return this.toView(direct);
    }
    const def = await this.getDefault();
    if (!def) {
      throw new Error("No default scenario guidance configured");
    }
    return this.toView(def);
  }

  /**
   * Resolve a scenarioKey from free-form text by keyword matching against
   * each guidance's `keywords` field. Returns the default key when nothing
   * matches.
   */
  async resolveKeyFromText(text: string): Promise<string> {
    const all = await this.getRepo().find();
    const lower = (text ?? "").toLowerCase();
    for (const g of all) {
      if (g.isDefault) continue;
      const kws = parseJsonArray(g.keywords);
      if (kws.some((kw) => kw && lower.includes(kw.toLowerCase()))) {
        return g.scenarioKey;
      }
    }
    const def = await this.getDefault();
    return def?.scenarioKey ?? "default";
  }

  // -------- Admin CRUD --------

  async listAll(): Promise<GuidanceView[]> {
    const rows = await this.getRepo().find({
      order: { isDefault: "DESC", scenarioKey: "ASC" },
    });
    return rows.map((r) => this.toView(r));
  }

  async findById(id: number) {
    return this.getRepo().findOneBy({ id });
  }

  async create(data: Partial<GuidanceView>): Promise<AiScenarioGuidance> {
    if (!data.scenarioKey || !data.name) {
      throw new Error("scenarioKey and name are required");
    }
    const existed = await this.getRepo().findOneBy({ scenarioKey: data.scenarioKey });
    if (existed) {
      throw new Error(`Scenario guidance "${data.scenarioKey}" already exists`);
    }

    if (data.isDefault) {
      await this.getRepo().update({ isDefault: true }, { isDefault: false });
    }

    const entity = this.getRepo().create({
      scenarioKey: data.scenarioKey,
      name: data.name,
      description: data.description ?? null,
      keywords: stringifyOrNull(data.keywords),
      persona: data.persona ?? "",
      tone: data.tone ?? "",
      focus: data.focus ?? "",
      opening: data.opening ?? "",
      progression: data.progression ?? "",
      closing: data.closing ?? "",
      maxUserTurns: data.maxUserTurns ?? 6,
      fallbackOpening: data.fallbackOpening ?? null,
      fallbackFollowUps: stringifyOrNull(data.fallbackFollowUps),
      isDefault: data.isDefault ?? false,
    });
    const saved = await this.getRepo().save(entity);
    this.invalidate();
    return saved;
  }

  async update(id: number, data: Partial<GuidanceView>): Promise<AiScenarioGuidance> {
    const entity = await this.getRepo().findOneBy({ id });
    if (!entity) throw new Error("Scenario guidance not found");

    if (data.isDefault === true && !entity.isDefault) {
      await this.getRepo().update({ isDefault: true }, { isDefault: false });
    }

    if (data.scenarioKey !== undefined) entity.scenarioKey = data.scenarioKey;
    if (data.name !== undefined) entity.name = data.name;
    if (data.description !== undefined) entity.description = data.description ?? null;
    if (data.keywords !== undefined) entity.keywords = stringifyOrNull(data.keywords);
    if (data.persona !== undefined) entity.persona = data.persona ?? "";
    if (data.tone !== undefined) entity.tone = data.tone ?? "";
    if (data.focus !== undefined) entity.focus = data.focus ?? "";
    if (data.opening !== undefined) entity.opening = data.opening ?? "";
    if (data.progression !== undefined) entity.progression = data.progression ?? "";
    if (data.closing !== undefined) entity.closing = data.closing ?? "";
    if (data.maxUserTurns !== undefined) entity.maxUserTurns = data.maxUserTurns ?? 6;
    if (data.fallbackOpening !== undefined) entity.fallbackOpening = data.fallbackOpening ?? null;
    if (data.fallbackFollowUps !== undefined) {
      entity.fallbackFollowUps = stringifyOrNull(data.fallbackFollowUps);
    }
    if (data.isDefault !== undefined) entity.isDefault = data.isDefault;

    const saved = await this.getRepo().save(entity);
    this.invalidate();
    return saved;
  }

  async delete(id: number) {
    const entity = await this.getRepo().findOneBy({ id });
    if (!entity) throw new Error("Scenario guidance not found");
    if (entity.isDefault) {
      throw new Error("Cannot delete the default scenario guidance");
    }
    await this.getRepo().remove(entity);
    this.invalidate();
  }
}

export const scenarioGuidanceService = new ScenarioGuidanceService();
