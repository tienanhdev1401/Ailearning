import { Router } from "express";
import {
  getConversationsByUser,
  getMessagesByConversation,
} from "../controllers/chat.controller";

const router = Router();

// Lấy tất cả hội thoại của user (staff hoặc student)
router.get("/conversations/:userId", getConversationsByUser);

// Lấy tin nhắn trong một hội thoại cụ thể
router.get("/messages/:conversationId", getMessagesByConversation);

export default router;
