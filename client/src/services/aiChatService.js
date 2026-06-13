import api from "../api/api";

export const AiChatService = {
  fetchScenarios: async () => {
    const { data } = await api.get("/ai-chat/scenarios");
    return data;
  },

  createScenario: async (payload) => {
    const { data } = await api.post("/ai-chat/scenarios", payload);
    return data;
  },

  startSession: async (payload) => {
    const { data } = await api.post("/ai-chat/sessions", payload);
    return data;
  },

  sendTextMessage: async (sessionId, text) => {
    const { data } = await api.post(`/ai-chat/sessions/${sessionId}/messages`, {
      text,
    });
    return data;
  },

  sendAudioMessage: async (sessionId, file) => {
    const formData = new FormData();
    formData.append("audio", file);
    const { data } = await api.post(`/ai-chat/sessions/${sessionId}/audio`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  listSessions: async () => {
    const { data } = await api.get("/ai-chat/sessions");
    return data;
  },

  deleteSession: async (sessionId) => {
    const { data } = await api.delete(`/ai-chat/sessions/${sessionId}`);
    return data;
  },

  getHistory: async (sessionId) => {
    const { data } = await api.get(`/ai-chat/sessions/${sessionId}/history`);
    return data;
  },

  completeSession: async (sessionId) => {
    const { data } = await api.post(`/ai-chat/sessions/${sessionId}/complete`);
    return data;
  },

  getEvaluation: async (sessionId) => {
    const { data } = await api.get(`/ai-chat/sessions/${sessionId}/evaluation`);
    return data;
  },

  synthesizeSpeech: async (text, voice) => {
    const payload = voice ? { text, voice } : { text };
    const { data } = await api.post("/ai-chat/speech", payload);
    return data;
  },
};

export default AiChatService;
