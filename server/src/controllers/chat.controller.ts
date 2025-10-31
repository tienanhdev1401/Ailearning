import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Conversation } from "../models/conversation";
import { Message } from "../models/message";
import { User } from "../models/user";

export const getConversationsByUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const convRepo = AppDataSource.getRepository(Conversation);

    // Lấy danh sách hội thoại có liên quan đến user (student hoặc staff)
    const conversations = await convRepo.find({
      where: [
        { student: { id: userId } },
        { staff: { id: userId } },
      ],
      relations: ["student", "staff"],
      order: { id: "DESC" },
    });

    res.json(conversations);
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách hội thoại:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getMessagesByConversation = async (req: Request, res: Response) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const msgRepo = AppDataSource.getRepository(Message);

    const messages = await msgRepo.find({
      where: { conversation: { id: conversationId } },
      relations: ["sender"],
      order: { id: "ASC" },
    });

    res.json(messages);
  } catch (error) {
    console.error("❌ Lỗi khi lấy tin nhắn:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
