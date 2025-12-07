import api from "../api/api";

export const SupportChatService = {
  getSession: async () => {
    const { data } = await api.get("/support-chat/session");
    return data;
  },

  sendUserMessage: async (content) => {
    const { data } = await api.post("/support-chat/session/messages", {
      content,
    });
    return data;
  },

  listMyConversations: async () => {
    const { data } = await api.get("/support-chat/my-conversations");
    return data;
  },

  createConversation: async () => {
    const { data } = await api.post("/support-chat/my-conversations");
    return data;
  },

  getMyConversationMessages: async (conversationId) => {
    const { data } = await api.get(`/support-chat/my-conversations/${conversationId}/messages`);
    return data;
  },

  deleteMyConversation: async (conversationId) => {
    await api.delete(`/support-chat/my-conversations/${conversationId}`);
  },

  deleteConversation: async (conversationId) => {
    await api.delete(`/support-chat/conversations/${conversationId}`);
  },

  sendMyConversationMessage: async (conversationId, content) => {
    const { data } = await api.post(`/support-chat/my-conversations/${conversationId}/messages`, {
      content,
    });
    return data;
  },

  listConversations: async (limit) => {
    const { data } = await api.get("/support-chat/conversations", {
      params: limit ? { limit } : undefined,
    });
    return data;
  },

  getConversationMessages: async (conversationId) => {
    const { data } = await api.get(`/support-chat/conversations/${conversationId}/messages`);
    return data;
  },

  sendStaffMessage: async (conversationId, content) => {
    const { data } = await api.post(`/support-chat/conversations/${conversationId}/messages`, {
      content,
    });
    return data;
  },

  updateStatus: async (conversationId, status) => {
    const { data } = await api.patch(`/support-chat/conversations/${conversationId}/status`, {
      status,
    });
    return data;
  },
};

export default SupportChatService;
