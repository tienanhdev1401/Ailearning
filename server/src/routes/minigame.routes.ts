import { Router } from "express";
import MiniGameController from "../controllers/minigame.controller";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import validateDto from "../middlewares/validateRequest.middleware";
import { CreateMiniGameDto } from "../dto/request/CreateMiniGameDTO";
import { UpdateMiniGameDto } from "../dto/request/UpdateMiniGameDTO";


const router = Router();

router.post("/", 
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(CreateMiniGameDto),
  MiniGameController.createMiniGame
);

router.get("/:id", 
  verifyTokenAndRole(),
  MiniGameController.getMiniGameById
);

router.put("/:id", 
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  validateDto(UpdateMiniGameDto),
  MiniGameController.updateMiniGame
);

router.delete("/:id", 
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  MiniGameController.deleteMiniGame);

export default router;
