import api from '../../api/api';

export const searchFlashcardsApi = (query) => {
    return api.get(`/minigames/search?q=${encodeURIComponent(query)}`);
};

const flashcardService = {
    searchFlashcardsApi,
};

export default flashcardService;
