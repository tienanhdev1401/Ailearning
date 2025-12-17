import express from "express";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import DashboardController from "../controllers/dashboard.controller";

const router = express.Router();

router.get(
  "/overview",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DashboardController.getOverview
);

export default router;