import api from '../api/api';

const vocabNoteService = {
  // Lấy danh sách từ vựng trong sổ tay của người dùng
  getMyNotes: async (page = 1, limit = 20) => {
    const response = await api.get(`/vocab-notes/me?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Thêm một từ vựng vào sổ tay
  addNote: async (term, definition, source) => {
    const response = await api.post("/vocab-notes", {
      term,
      definition,
      source,
    });
    return response.data;
  },

  // Xóa một từ vựng khỏi sổ tay
  deleteNote: async (id) => {
    const response = await api.delete(`/vocab-notes/${id}`);
    return response.data;
  },
};

export default vocabNoteService;
