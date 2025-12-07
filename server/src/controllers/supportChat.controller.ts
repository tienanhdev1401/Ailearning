import { Request, Response } from "express";
import USER_ROLE from "../enums/userRole.enum";
import SUPPORT_CONVERSATION_STATUS from "../enums/supportConversationStatus.enum";
import { supportChatService } from "../services/support-chat/supportChat.service";
const getAuthContext = (req: Request) => ({
  id: (req as any).user?.id as number | undefined,
  role: (req as any).user?.role as USER_ROLE | undefined,
});

export const getMySupportSession = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const session = await supportChatService.getOrCreateUserSession(id);
    res.json(session);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không lấy được cuộc trò chuyện" });
  }
};

export const postMySupportMessage = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const { content } = req.body ?? {};
    const result = await supportChatService.sendUserMessage(id, content ?? "");
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không gửi được tin nhắn" });
  }
};

export const listMySupportConversations = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversations = await supportChatService.listUserConversations(id);
    res.json(conversations);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không lấy được danh sách" });
  }
};

export const createMySupportConversation = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversation = await supportChatService.startNewConversation(id);
    res.status(201).json(conversation);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không tạo được cuộc trò chuyện" });
  }
};

export const getMySupportConversationMessages = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversationId = Number(req.params.id);
    const transcript = await supportChatService.getConversationTranscript(
      conversationId,
      id,
      USER_ROLE.USER
    );
    res.json(transcript);
  } catch (error: any) {
    const status = error.message?.includes("quyền") ? 403 : 400;
    res.status(status).json({ message: error.message ?? "Không lấy được cuộc trò chuyện" });
  }
};

export const postMySupportConversationMessage = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversationId = Number(req.params.id);
    const { content } = req.body ?? {};
    const result = await supportChatService.sendUserMessageToConversation(
      conversationId,
      id,
      content ?? ""
    );
    res.status(201).json(result);
  } catch (error: any) {
    const status = error.message?.includes("quyền") ? 403 : 400;
    res.status(status).json({ message: error.message ?? "Không gửi được tin nhắn" });
  }
};

export const deleteMySupportConversation = async (req: Request, res: Response) => {
  try {
    const { id } = getAuthContext(req);
    if (!id) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversationId = Number(req.params.id);
    await supportChatService.deleteUserConversation(conversationId, id);
    res.status(204).send();
  } catch (error: any) {
    const status = error.message?.includes("quyền") ? 403 : 400;
    res.status(status).json({ message: error.message ?? "Không xóa được cuộc trò chuyện" });
  }
};

export const deleteSupportConversation = async (req: Request, res: Response) => {
  try {
    const { id, role } = getAuthContext(req);
    if (!id || !role || ![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const conversationId = Number(req.params.id);
    await supportChatService.deleteConversationAsStaff(conversationId, id);
    res.status(204).send();
  } catch (error: any) {
    const status = error.message?.includes("quyền") ? 403 : 400;
    res.status(status).json({ message: error.message ?? "Không xóa được cuộc trò chuyện" });
  }
};

export const listSupportConversations = async (req: Request, res: Response) => {
  try {
    const { id, role } = getAuthContext(req);
    if (!id || !role || ![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const limit = Number(req.query.limit) || 50;
    const conversations = await supportChatService.listConversationsForStaff(limit);
    res.json(conversations);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không lấy được danh sách" });
  }
};

export const getSupportConversationMessages = async (req: Request, res: Response) => {
  try {
    const { id, role } = getAuthContext(req);
    if (!id || !role) {
      return res.status(401).json({ message: "Bạn chưa đăng nhập" });
    }

    const conversationId = Number(req.params.id);
    const transcript = await supportChatService.getConversationTranscript(conversationId, id, role);
    res.json(transcript);
  } catch (error: any) {
    const status = error.message?.includes("quyền") ? 403 : 400;
    res.status(status).json({ message: error.message ?? "Không lấy được lịch sử" });
  }
};

export const postStaffSupportMessage = async (req: Request, res: Response) => {
  try {
    const { id, role } = getAuthContext(req);
    if (!id || !role || ![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const conversationId = Number(req.params.id);
    const { content } = req.body ?? {};
    const result = await supportChatService.sendStaffMessage(conversationId, id, content ?? "");
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không gửi được tin nhắn" });
  }
};

export const patchSupportConversationStatus = async (req: Request, res: Response) => {
  try {
    const { id, role } = getAuthContext(req);
    if (!id || !role || ![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }

    const conversationId = Number(req.params.id);
    const status = req.body?.status as SUPPORT_CONVERSATION_STATUS | undefined;
    if (!status || !Object.values(SUPPORT_CONVERSATION_STATUS).includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updated = await supportChatService.updateConversationStatus(conversationId, id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message ?? "Không cập nhật được trạng thái" });
  }
};
