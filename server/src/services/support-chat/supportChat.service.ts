import { In, Repository } from "typeorm";
import { AppDataSource } from "../../config/database";
import { SupportConversation } from "../../models/supportConversation";
import { SupportMessage } from "../../models/supportMessage";
import { User } from "../../models/user";
import SUPPORT_CONVERSATION_STATUS from "../../enums/supportConversationStatus.enum";
import SUPPORT_MESSAGE_AUTHOR from "../../enums/supportMessageAuthor.enum";
import USER_ROLE from "../../enums/userRole.enum";
import { emitSupportChatEvent } from "../../socket";

export interface SupportConversationDTO {
  id: number;
  subject: string | null;
  status: SUPPORT_CONVERSATION_STATUS;
  resolvedAt: Date | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  assignee: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export interface SupportMessageDTO {
  id: number;
  conversationId: number;
  senderId: number | null;
  senderRole: SUPPORT_MESSAGE_AUTHOR;
  senderName: string | null;
  senderAvatar: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const toConversationDTO = (conversation: SupportConversation): SupportConversationDTO => ({
  id: conversation.id,
  subject: conversation.subject,
  status: conversation.status,
  resolvedAt: conversation.resolvedAt,
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
  customer: {
    id: conversation.customer.id,
    name: conversation.customer.name,
    email: conversation.customer.email,
    avatarUrl: conversation.customer.avatarUrl,
  },
  assignee: conversation.assignee
    ? {
        id: conversation.assignee.id,
        name: conversation.assignee.name,
        email: conversation.assignee.email,
        avatarUrl: conversation.assignee.avatarUrl,
      }
    : null,
});

const toMessageDTO = (message: SupportMessage): SupportMessageDTO => ({
  id: message.id,
  conversationId: message.conversation.id,
  senderId: message.sender ? message.sender.id : null,
  senderRole: message.senderRole,
  senderName: message.sender ? message.sender.name : null,
  senderAvatar: message.sender ? message.sender.avatarUrl : null,
  content: message.content,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const sanitizeContent = (input: string | undefined): string => input?.trim() ?? "";

class SupportChatService {
  private conversationRepo: Repository<SupportConversation>;
  private messageRepo: Repository<SupportMessage>;
  private userRepo: Repository<User>;

  constructor() {
    this.conversationRepo = AppDataSource.getRepository(SupportConversation);
    this.messageRepo = AppDataSource.getRepository(SupportMessage);
    this.userRepo = AppDataSource.getRepository(User);
  }

  private async findActiveConversation(userId: number) {
    return this.conversationRepo.findOne({
      where: {
        customer: { id: userId },
        status: In([
          SUPPORT_CONVERSATION_STATUS.OPEN,
          SUPPORT_CONVERSATION_STATUS.RESOLVED,
        ]),
      },
      order: { updatedAt: "DESC" },
      relations: { customer: true, assignee: true },
    });
  }

  private async loadConversation(conversationId: number) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: { customer: true, assignee: true },
    });
    if (!conversation) {
      throw new Error("Cuộc trò chuyện không tồn tại");
    }
    return conversation;
  }

  private assertUserOwnsConversation(conversation: SupportConversation, userId: number) {
    if (conversation.customer.id !== userId) {
      throw new Error("Bạn không có quyền truy cập cuộc trò chuyện này");
    }
  }

  private async resolveUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }
    return user;
  }

  async getOrCreateUserSession(userId: number) {
    let conversation = await this.findActiveConversation(userId);
    if (!conversation) {
      const customer = await this.resolveUser(userId);
      conversation = this.conversationRepo.create({
        customer,
        assignee: null,
        subject: null,
        status: SUPPORT_CONVERSATION_STATUS.OPEN,
        resolvedAt: null,
        lastMessageAt: null,
      });
      conversation = await this.conversationRepo.save(conversation);
      conversation = await this.loadConversation(conversation.id);
    }

    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      relations: { conversation: true, sender: true },
      order: { createdAt: "ASC" },
    });

    return {
      conversation: toConversationDTO(conversation),
      messages: messages.map(toMessageDTO),
    };
  }

  async listUserConversations(userId: number) {
    const conversations = await this.conversationRepo.find({
      where: { customer: { id: userId } },
      relations: { customer: true, assignee: true },
      order: { updatedAt: "DESC" },
    });

    return conversations.map(toConversationDTO);
  }

  async startNewConversation(userId: number) {
    const customer = await this.resolveUser(userId);
    const activeConversation = await this.findActiveConversation(userId);
    if (activeConversation && activeConversation.status === SUPPORT_CONVERSATION_STATUS.OPEN) {
      activeConversation.status = SUPPORT_CONVERSATION_STATUS.CLOSED;
      activeConversation.resolvedAt = new Date();
      await this.conversationRepo.save(activeConversation);
    }

    let conversation = this.conversationRepo.create({
      customer,
      assignee: null,
      subject: null,
      status: SUPPORT_CONVERSATION_STATUS.OPEN,
      resolvedAt: null,
      lastMessageAt: null,
    });
    conversation = await this.conversationRepo.save(conversation);
    conversation = await this.loadConversation(conversation.id);
    return toConversationDTO(conversation);
  }

  async deleteUserConversation(conversationId: number, userId: number) {
    const conversation = await this.loadConversation(conversationId);
    this.assertUserOwnsConversation(conversation, userId);
    await this.conversationRepo.delete(conversationId);
  }

  async deleteConversationAsStaff(conversationId: number, staffId: number) {
    const staff = await this.resolveUser(staffId);
    if (![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(staff.role)) {
      throw new Error("Tài khoản không có quyền xóa cuộc trò chuyện");
    }
    await this.loadConversation(conversationId);
    await this.conversationRepo.delete(conversationId);
  }

  async sendUserMessage(userId: number, content: string) {
    const text = sanitizeContent(content);
    if (!text) {
      throw new Error("Nội dung không được để trống");
    }

    const customer = await this.resolveUser(userId);
    let conversation = await this.findActiveConversation(userId);
    if (!conversation) {
      conversation = this.conversationRepo.create({
        customer,
        assignee: null,
        subject: null,
        status: SUPPORT_CONVERSATION_STATUS.OPEN,
        resolvedAt: null,
        lastMessageAt: null,
      });
      conversation = await this.conversationRepo.save(conversation);
      conversation = await this.loadConversation(conversation.id);
    }

    this.assertUserOwnsConversation(conversation, userId);

    const message = this.messageRepo.create({
      conversation,
      sender: customer,
      senderRole: SUPPORT_MESSAGE_AUTHOR.USER,
      content: text,
    });

    const saved = await this.messageRepo.save(message);
    conversation.lastMessageAt = saved.createdAt;
    conversation.status = SUPPORT_CONVERSATION_STATUS.OPEN;
    await this.conversationRepo.save(conversation);

    const hydratedConversation = await this.loadConversation(conversation.id);
    const dto = toMessageDTO({ ...saved, conversation: hydratedConversation, sender: customer });
    emitSupportChatEvent(hydratedConversation.id, "support_message", dto);

    return {
      conversation: toConversationDTO(hydratedConversation),
      message: dto,
    };
  }

  async sendUserMessageToConversation(conversationId: number, userId: number, content: string) {
    const text = sanitizeContent(content);
    if (!text) {
      throw new Error("Nội dung không được để trống");
    }

    const customer = await this.resolveUser(userId);
    const conversation = await this.loadConversation(conversationId);
    this.assertUserOwnsConversation(conversation, userId);

    const message = this.messageRepo.create({
      conversation,
      sender: customer,
      senderRole: SUPPORT_MESSAGE_AUTHOR.USER,
      content: text,
    });

    const saved = await this.messageRepo.save(message);
    conversation.lastMessageAt = saved.createdAt;
    conversation.status = SUPPORT_CONVERSATION_STATUS.OPEN;
    conversation.resolvedAt = null;
    await this.conversationRepo.save(conversation);

    const hydratedConversation = await this.loadConversation(conversation.id);
    const dto = toMessageDTO({ ...saved, conversation: hydratedConversation, sender: customer });
    emitSupportChatEvent(hydratedConversation.id, "support_message", dto);

    return {
      conversation: toConversationDTO(hydratedConversation),
      message: dto,
    };
  }

  async listConversationsForStaff(limit = 50) {
    const conversations = await this.conversationRepo.find({
      relations: { customer: true, assignee: true },
      order: {
        lastMessageAt: "DESC",
        updatedAt: "DESC",
      },
      take: limit,
    });

    return conversations.map(toConversationDTO);
  }

  async getConversationTranscript(conversationId: number, requesterId: number, requesterRole: USER_ROLE) {
    const conversation = await this.loadConversation(conversationId);

    if (requesterRole === USER_ROLE.USER) {
      this.assertUserOwnsConversation(conversation, requesterId);
    }

    const messages = await this.messageRepo.find({
      where: { conversation: { id: conversation.id } },
      relations: { conversation: true, sender: true },
      order: { createdAt: "ASC" },
    });

    return {
      conversation: toConversationDTO(conversation),
      messages: messages.map(toMessageDTO),
    };
  }

  async sendStaffMessage(conversationId: number, staffId: number, content: string) {
    const text = sanitizeContent(content);
    if (!text) {
      throw new Error("Nội dung không được để trống");
    }

    const staff = await this.resolveUser(staffId);
    if (![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(staff.role)) {
      throw new Error("Tài khoản không có quyền hỗ trợ khách hàng");
    }

    const conversation = await this.loadConversation(conversationId);

    if (!conversation.assignee) {
      conversation.assignee = staff;
    }

    const message = this.messageRepo.create({
      conversation,
      sender: staff,
      senderRole: SUPPORT_MESSAGE_AUTHOR.STAFF,
      content: text,
    });

    const saved = await this.messageRepo.save(message);
    conversation.lastMessageAt = saved.createdAt;
    if (conversation.status === SUPPORT_CONVERSATION_STATUS.RESOLVED) {
      conversation.status = SUPPORT_CONVERSATION_STATUS.OPEN;
      conversation.resolvedAt = null;
    }
    await this.conversationRepo.save(conversation);

    const hydratedConversation = await this.loadConversation(conversation.id);
    const dto = toMessageDTO({
      ...saved,
      conversation: hydratedConversation,
      sender: staff,
    });
    emitSupportChatEvent(hydratedConversation.id, "support_message", dto);

    return {
      conversation: toConversationDTO(hydratedConversation),
      message: dto,
    };
  }

  async updateConversationStatus(conversationId: number, staffId: number, status: SUPPORT_CONVERSATION_STATUS) {
    const staff = await this.resolveUser(staffId);
    if (![USER_ROLE.ADMIN, USER_ROLE.STAFF].includes(staff.role)) {
      throw new Error("Tài khoản không có quyền cập nhật trạng thái");
    }

    const conversation = await this.loadConversation(conversationId);

    conversation.status = status;
    conversation.resolvedAt = status === SUPPORT_CONVERSATION_STATUS.RESOLVED ? new Date() : conversation.resolvedAt;
    if (status === SUPPORT_CONVERSATION_STATUS.OPEN) {
      conversation.resolvedAt = null;
    }

    await this.conversationRepo.save(conversation);
    const hydratedConversation = await this.loadConversation(conversation.id);
    const dto = toConversationDTO(hydratedConversation);
    emitSupportChatEvent(hydratedConversation.id, "support_status", dto);
    return dto;
  }
}

export const supportChatService = new SupportChatService();
