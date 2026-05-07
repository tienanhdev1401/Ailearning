import { Router } from "express";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import {
  listPrompts,
  listPromptFeatures,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  previewPrompt,
  listGuidance,
  getGuidance,
  createGuidance,
  updateGuidance,
  deleteGuidance,
} from "../controllers/aiPrompt.controller";

const router = Router();

// All routes require admin role.
const requireAdmin = verifyTokenAndRole(["admin"]);

// ----- Prompt templates -----
router.get("/prompts", requireAdmin, listPrompts);
router.get("/prompts/features", requireAdmin, listPromptFeatures);
router.post("/prompts/preview", requireAdmin, previewPrompt);
router.get("/prompts/:id", requireAdmin, getPrompt);
router.post("/prompts", requireAdmin, createPrompt);
router.put("/prompts/:id", requireAdmin, updatePrompt);
router.delete("/prompts/:id", requireAdmin, deletePrompt);

// ----- Scenario guidance -----
router.get("/scenario-guidance", requireAdmin, listGuidance);
router.get("/scenario-guidance/:id", requireAdmin, getGuidance);
router.post("/scenario-guidance", requireAdmin, createGuidance);
router.put("/scenario-guidance/:id", requireAdmin, updateGuidance);
router.delete("/scenario-guidance/:id", requireAdmin, deleteGuidance);

export default router;
