import express from "express";
import { ActivityController } from "../controllers/activity.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateActivityDto } from "../dto/request/CreateActivityDTO";
import { UpdateActivityDto } from "../dto/request/UpdateActivityDTO";
import { UpdateManyActivitiesDto } from "../dto/request/UpdateManyActivitiesDTO";
import MiniGameController from "../controllers/minigame.controller";

const router = express.Router();

router.post(
  "/",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(CreateActivityDto),
  ActivityController.addActivityToDay
);

router.get(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  ActivityController.getById
);

router.put(
  "/:id",
  validateDto(UpdateActivityDto),
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  ActivityController.updateActivity
);

router.delete(
  "/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  ActivityController.deleteActivity
);

// Cập nhật nhiều activity (ví dụ: đổi thứ tự hoặc nội dung)
router.patch(
  "/mutiple-update",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(UpdateManyActivitiesDto),
  ActivityController.updateManyActivities
);

router.get("/:activityId/minigames", MiniGameController.getMiniGamesByActivity);

export default router;