import api from "../../api/api";

const BASE = "/admin/ai";

const AiPromptService = {
  // Prompt templates
  listPrompts: async (params = {}) => {
    const { data } = await api.get(`${BASE}/prompts`, { params });
    return data;
  },
  listFeatures: async () => {
    const { data } = await api.get(`${BASE}/prompts/features`);
    return data;
  },
  getPrompt: async (id) => {
    const { data } = await api.get(`${BASE}/prompts/${id}`);
    return data;
  },
  createPrompt: async (payload) => {
    const { data } = await api.post(`${BASE}/prompts`, payload);
    return data;
  },
  updatePrompt: async (id, payload) => {
    const { data } = await api.put(`${BASE}/prompts/${id}`, payload);
    return data;
  },
  deletePrompt: async (id) => {
    await api.delete(`${BASE}/prompts/${id}`);
  },
  previewPrompt: async (template, variables) => {
    const { data } = await api.post(`${BASE}/prompts/preview`, { template, variables });
    return data;
  },

  // Scenario guidance
  listGuidance: async () => {
    const { data } = await api.get(`${BASE}/scenario-guidance`);
    return data;
  },
  getGuidance: async (id) => {
    const { data } = await api.get(`${BASE}/scenario-guidance/${id}`);
    return data;
  },
  createGuidance: async (payload) => {
    const { data } = await api.post(`${BASE}/scenario-guidance`, payload);
    return data;
  },
  updateGuidance: async (id, payload) => {
    const { data } = await api.put(`${BASE}/scenario-guidance/${id}`, payload);
    return data;
  },
  deleteGuidance: async (id) => {
    await api.delete(`${BASE}/scenario-guidance/${id}`);
  },
};

export default AiPromptService;
