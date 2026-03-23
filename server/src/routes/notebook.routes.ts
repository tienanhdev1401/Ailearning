import { Router } from "express";
import { NotebookController } from "../controllers/notebook.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyTokenAndRole());

router.post("/", NotebookController.createNotebook);
router.get("/", NotebookController.getMyNotebooks);
router.get("/:id", NotebookController.getNotebookById);
router.put("/:id", NotebookController.updateNotebook);
router.delete("/:id", NotebookController.deleteNotebook);
router.post("/:id/cards", NotebookController.addCard);

export default router;
