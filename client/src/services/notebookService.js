import api from '../api/api';

const notebookService = {
  getMyNotebooks: async () => {
    const response = await api.get('/notebooks');
    return response.data;
  },

  getNotebookById: async (id) => {
    const response = await api.get(`/notebooks/${id}`);
    return response.data;
  },

  createNotebook: async (title, description) => {
    const response = await api.post('/notebooks', { title, description });
    return response.data;
  },

  updateNotebook: async (id, title, description) => {
    const response = await api.put(`/notebooks/${id}`, { title, description });
    return response.data;
  },

  deleteNotebook: async (id) => {
    const response = await api.delete(`/notebooks/${id}`);
    return response.data;
  },

  addCard: async (notebookId, term, definition, source) => {
    const response = await api.post(`/notebooks/${notebookId}/cards`, {
      term,
      definition,
      source,
    });
    return response.data;
  },
};

export default notebookService;
