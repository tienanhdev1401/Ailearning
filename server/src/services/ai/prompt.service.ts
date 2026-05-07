import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { AiPrompt } from "../../models/aiPrompt";

/**
 * Generic Prompt Service used by every AI-generative feature.
 *
 * Responsibilities (Single Responsibility):
 *   - resolve a prompt by (feature, key) — with optional fallback key
 *   - render the template with `{{variable}}` substitution
 *   - expose generation parameters (provider, model, temperature, ...)
 *   - cache hot prompts and invalidate cache when admin updates one
 *
 * Open/Closed: adding a new AI feature requires NO change here. The new feature
 * just calls `promptService.render("its_namespace", "key", vars)`.
 */

export interface PromptGenerationConfig {
  provider: string | null;
  model: string | null;
  temperature: number | null;
  topP: number | null;
  maxOutputTokens: number | null;
}

export interface ResolvedPrompt {
  id: number;
  feature: string;
  key: string;
  template: string;
  config: PromptGenerationConfig;
}

export class PromptNotFoundError extends Error {
  constructor(feature: string, key: string) {
    super(`Prompt not found: feature="${feature}" key="${key}"`);
    this.name = "PromptNotFoundError";
  }
}

const cacheKey = (feature: string, key: string) => `${feature}::${key}`;

class PromptService {
  private repo: Repository<AiPrompt> | null = null;
  private cache = new Map<string, AiPrompt>();

  private getRepo(): Repository<AiPrompt> {
    if (!this.repo) {
      this.repo = AppDataSource.getRepository(AiPrompt);
    }
    return this.repo;
  }

  /** Clear cache (call after CRUD writes). */
  invalidate(feature?: string, key?: string) {
    if (feature && key) {
      this.cache.delete(cacheKey(feature, key));
      return;
    }
    this.cache.clear();
  }

  async findOne(feature: string, key: string): Promise<AiPrompt | null> {
    const ck = cacheKey(feature, key);
    if (this.cache.has(ck)) {
      return this.cache.get(ck)!;
    }
    const found = await this.getRepo().findOne({
      where: { feature, key, isActive: true },
    });
    if (found) {
      this.cache.set(ck, found);
    }
    return found;
  }

  async resolve(
    feature: string,
    key: string,
    fallbackKey?: string
  ): Promise<ResolvedPrompt> {
    let prompt = await this.findOne(feature, key);
    if (!prompt && fallbackKey && fallbackKey !== key) {
      prompt = await this.findOne(feature, fallbackKey);
    }
    if (!prompt) {
      throw new PromptNotFoundError(feature, key);
    }
    return {
      id: prompt.id,
      feature: prompt.feature,
      key: prompt.key,
      template: prompt.template,
      config: {
        provider: prompt.provider,
        model: prompt.model,
        temperature: prompt.temperature,
        topP: prompt.topP,
        maxOutputTokens: prompt.maxOutputTokens,
      },
    };
  }

  /**
   * Render a `{{variable}}` template against a values map. Unknown tokens
   * resolve to empty strings (intentional — keeps prompts forgiving).
   */
  renderTemplate(template: string, vars: Record<string, string | number | boolean | null | undefined>): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, token) => {
      const raw = vars[token];
      if (raw === undefined || raw === null) return "";
      return String(raw);
    });
  }

  async render(
    feature: string,
    key: string,
    vars: Record<string, string | number | boolean | null | undefined>,
    fallbackKey?: string
  ): Promise<{ text: string; resolved: ResolvedPrompt }> {
    const resolved = await this.resolve(feature, key, fallbackKey);
    return {
      text: this.renderTemplate(resolved.template, vars),
      resolved,
    };
  }

  // -------- Admin CRUD helpers --------

  async listAll(filters?: { feature?: string; search?: string }) {
    const qb = this.getRepo().createQueryBuilder("p");
    if (filters?.feature) {
      qb.andWhere("p.feature = :feature", { feature: filters.feature });
    }
    if (filters?.search) {
      qb.andWhere(
        "(p.key LIKE :s OR p.name LIKE :s OR p.description LIKE :s)",
        { s: `%${filters.search}%` }
      );
    }
    qb.orderBy("p.feature", "ASC").addOrderBy("p.key", "ASC");
    return qb.getMany();
  }

  async listFeatures(): Promise<string[]> {
    const rows = await this.getRepo()
      .createQueryBuilder("p")
      .select("DISTINCT p.feature", "feature")
      .getRawMany();
    return rows.map((r) => r.feature).filter(Boolean);
  }

  async findById(id: number) {
    return this.getRepo().findOneBy({ id });
  }

  async create(data: Partial<AiPrompt>) {
    if (!data.feature || !data.key || !data.name || !data.template) {
      throw new Error("feature, key, name and template are required");
    }
    const existed = await this.getRepo().findOneBy({
      feature: data.feature,
      key: data.key,
    });
    if (existed) {
      throw new Error(`Prompt with feature="${data.feature}" and key="${data.key}" already exists`);
    }
    const entity = this.getRepo().create({
      feature: data.feature,
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      template: data.template,
      variables: data.variables ?? null,
      provider: data.provider ?? null,
      model: data.model ?? null,
      temperature: data.temperature ?? null,
      topP: data.topP ?? null,
      maxOutputTokens: data.maxOutputTokens ?? null,
      isActive: data.isActive ?? true,
    });
    const saved = await this.getRepo().save(entity);
    this.invalidate(saved.feature, saved.key);
    return saved;
  }

  async update(id: number, data: Partial<AiPrompt>) {
    const entity = await this.getRepo().findOneBy({ id });
    if (!entity) {
      throw new Error("Prompt not found");
    }
    const beforeFeature = entity.feature;
    const beforeKey = entity.key;

    if (data.feature !== undefined) entity.feature = data.feature;
    if (data.key !== undefined) entity.key = data.key;
    if (data.name !== undefined) entity.name = data.name;
    if (data.description !== undefined) entity.description = data.description ?? null;
    if (data.template !== undefined) entity.template = data.template;
    if (data.variables !== undefined) entity.variables = data.variables ?? null;
    if (data.provider !== undefined) entity.provider = data.provider ?? null;
    if (data.model !== undefined) entity.model = data.model ?? null;
    if (data.temperature !== undefined) entity.temperature = data.temperature ?? null;
    if (data.topP !== undefined) entity.topP = data.topP ?? null;
    if (data.maxOutputTokens !== undefined) entity.maxOutputTokens = data.maxOutputTokens ?? null;
    if (data.isActive !== undefined) entity.isActive = data.isActive;

    const saved = await this.getRepo().save(entity);
    this.invalidate(beforeFeature, beforeKey);
    this.invalidate(saved.feature, saved.key);
    return saved;
  }

  async delete(id: number) {
    const entity = await this.getRepo().findOneBy({ id });
    if (!entity) {
      throw new Error("Prompt not found");
    }
    await this.getRepo().remove(entity);
    this.invalidate(entity.feature, entity.key);
  }
}

export const promptService = new PromptService();
