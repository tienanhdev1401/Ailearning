import { Router } from "express";
import verifyTokenAndRole from "../middlewares/auth.middleware";
import USER_ROLE from "../enums/userRole.enum";
import {
  getMySupportSession,
  postMySupportMessage,
  listMySupportConversations,
  createMySupportConversation,
  getMySupportConversationMessages,
  postMySupportConversationMessage,
  deleteMySupportConversation,
  listSupportConversations,
  getSupportConversationMessages,
  postStaffSupportMessage,
  patchSupportConversationStatus,
  deleteSupportConversation,
} from "../controllers/supportChat.controller";

const router = Router();

router.get("/session", verifyTokenAndRole(), getMySupportSession);
router.post("/session/messages", verifyTokenAndRole(), postMySupportMessage);

router.get("/my-conversations", verifyTokenAndRole(), listMySupportConversations);
router.post("/my-conversations", verifyTokenAndRole(), createMySupportConversation);
router.get(
  "/my-conversations/:id/messages",
  verifyTokenAndRole(),
  getMySupportConversationMessages
);
router.delete(
  "/my-conversations/:id",
  verifyTokenAndRole(),
  deleteMySupportConversation
);
router.post(
  "/my-conversations/:id/messages",
  verifyTokenAndRole(),
  postMySupportConversationMessage
);

router.get(
  "/conversations",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  listSupportConversations
);
router.get(
  "/conversations/:id/messages",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  getSupportConversationMessages
);
router.post(
  "/conversations/:id/messages",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  postStaffSupportMessage
);
router.patch(
  "/conversations/:id/status",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  patchSupportConversationStatus
);
router.delete(
  "/conversations/:id",
  verifyTokenAndRole([USER_ROLE.ADMIN, USER_ROLE.STAFF]),
  deleteSupportConversation
);

export default router;
