import api from '../api/api';

const dailyChallengeService = {
  getStatus: async (roadmapId) => {
    const response = await api.get(`/daily-challenge/status/${roadmapId}`);
    return response.data;
  },

  generateChallenge: async (roadmapId) => {
    const response = await api.get(`/daily-challenge/generate/${roadmapId}`);
    return response.data;
  },

  submitChallenge: async (roadmapId) => {
    const response = await api.post(`/daily-challenge/submit/${roadmapId}`);
    return response.data;
  }
};

export default dailyChallengeService;
