import api from '../../api/api';

export const fetchRoadmapReviews = async (roadmapId, params = {}) => {
  const response = await api.get(`/roadmaps/${roadmapId}/reviews`, { params });
  return response.data;
};

export const createRoadmapReview = async (roadmapId, payload) => {
  const response = await api.post(`/roadmaps/${roadmapId}/reviews`, payload);
  return response.data;
};

export const updateRoadmapReview = async (roadmapId, reviewId, payload) => {
  const response = await api.patch(`/roadmaps/${roadmapId}/reviews/${reviewId}`, payload);
  return response.data;
};

export const deleteRoadmapReview = async (roadmapId, reviewId) => {
  const response = await api.delete(`/roadmaps/${roadmapId}/reviews/${reviewId}`);
  return response.data;
};

