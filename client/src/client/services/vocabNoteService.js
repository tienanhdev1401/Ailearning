import api from '../../api/api';

export const getMyNotesApi = (page = 1, limit = 20) => {
    return api.get(`/vocab-notes/me?page=${page}&limit=${limit}`);
};

export const searchMyNotesApi = (query) => {
    return api.get(`/vocab-notes/search?q=${encodeURIComponent(query)}`);
};

export const addVocabNoteApi = (data) => {
    return api.get('/vocab-notes', data);
};

export const deleteVocabNoteApi = (id) => {
    return api.delete(`/vocab-notes/${id}`);
};

const vocabNoteService = {
    getMyNotesApi,
    searchMyNotesApi,
    addVocabNoteApi,
    deleteVocabNoteApi
};

export default vocabNoteService;
