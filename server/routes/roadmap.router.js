import express from "express";
import RoadmapController from "../controllers/roadmap.controller.js";

const router = express.Router();


router.get("/", RoadmapController.getAll);
router.get("/:id", RoadmapController.getById);
router.get("/level/:level", RoadmapController.getByLevel);
router.post("/", RoadmapController.create);
router.put("/:id", RoadmapController.update);
router.delete("/:id", RoadmapController.delete);

export default router;