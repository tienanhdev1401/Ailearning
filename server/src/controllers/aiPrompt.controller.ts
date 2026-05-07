import { Request, Response } from "express";
import { promptService } from "../services/ai/prompt.service";
import { scenarioGuidanceService } from "../services/ai/scenarioGuidance.service";

// ---------------- AI Prompts CRUD ----------------

export const listPrompts = async (req: Request, res: Response) => {
  try {
    const feature = typeof req.query.feature === "string" ? req.query.feature : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const items = await promptService.listAll({ feature, search });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load prompts" });
  }
};

export const listPromptFeatures = async (_req: Request, res: Response) => {
  try {
    const features = await promptService.listFeatures();
    res.json(features);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load features" });
  }
};

export const getPrompt = async (req: Request, res: Response) => {
  try {
    const item = await promptService.findById(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Prompt not found" });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load prompt" });
  }
};

export const createPrompt = async (req: Request, res: Response) => {
  try {
    const created = await promptService.create(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to create prompt" });
  }
};

export const updatePrompt = async (req: Request, res: Response) => {
  try {
    const updated = await promptService.update(Number(req.params.id), req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to update prompt" });
  }
};

export const deletePrompt = async (req: Request, res: Response) => {
  try {
    await promptService.delete(Number(req.params.id));
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to delete prompt" });
  }
};

export const previewPrompt = async (req: Request, res: Response) => {
  try {
    const { template, variables } = req.body ?? {};
    if (typeof template !== "string") {
      return res.status(400).json({ message: "template is required" });
    }
    const text = promptService.renderTemplate(template, variables ?? {});
    res.json({ text });
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to render preview" });
  }
};

// ---------------- Scenario Guidance CRUD ----------------

export const listGuidance = async (_req: Request, res: Response) => {
  try {
    res.json(await scenarioGuidanceService.listAll());
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load guidance" });
  }
};

export const getGuidance = async (req: Request, res: Response) => {
  try {
    const item = await scenarioGuidanceService.findById(Number(req.params.id));
    if (!item) return res.status(404).json({ message: "Guidance not found" });
    res.json(scenarioGuidanceService.toView(item));
  } catch (error: any) {
    res.status(500).json({ message: error.message ?? "Failed to load guidance" });
  }
};

export const createGuidance = async (req: Request, res: Response) => {
  try {
    const created = await scenarioGuidanceService.create(req.body);
    res.status(201).json(scenarioGuidanceService.toView(created));
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to create guidance" });
  }
};

export const updateGuidance = async (req: Request, res: Response) => {
  try {
    const updated = await scenarioGuidanceService.update(Number(req.params.id), req.body);
    res.json(scenarioGuidanceService.toView(updated));
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to update guidance" });
  }
};

export const deleteGuidance = async (req: Request, res: Response) => {
  try {
    await scenarioGuidanceService.delete(Number(req.params.id));
    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Failed to delete guidance" });
  }
};
