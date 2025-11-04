import { Router } from "express";
import { UserConfirmController } from "../controllers/userconfirm.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyTokenAndRole(), UserConfirmController.create);

// Check lần đầu login
router.get("/check", verifyTokenAndRole(), UserConfirmController.checkFirstConfirm);

// Lấy confirmedData
router.get("/data", verifyTokenAndRole(), UserConfirmController.getConfirmData);

export default router;
