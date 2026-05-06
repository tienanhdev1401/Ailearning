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

router.get(
  "/transactions",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DashboardController.getTransactions
);

router.get(
  "/top-customers",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DashboardController.getTopCustomers
);

router.get(
  "/subscriptions",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  DashboardController.getSubscriptions
);

export default router;