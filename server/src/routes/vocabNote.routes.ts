import { Router } from "express";
import VocabNoteController from "../controllers/vocabNote.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateVocabNoteDto } from "../dto/request/CreateVocabNoteDTO";


const router = Router();



router.post("/", verifyTokenAndRole(), validateDto(CreateVocabNoteDto), VocabNoteController.addNote);
router.get("/me", verifyTokenAndRole(), VocabNoteController.getMyNotes);
router.delete("/:id", verifyTokenAndRole(), VocabNoteController.deleteNote);

export default router;
