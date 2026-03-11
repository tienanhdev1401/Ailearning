import { Router } from "express";
import { getMySubscriptions } from "../controllers/subscription.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";

const router = Router();

router.get("/my", verifyTokenAndRole(), getMySubscriptions);

export default router;
