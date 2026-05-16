import api from '../../api/api';

// Get lesson by id
export const getLessonApi = (id) => {
  const URL_API = `/lessons/${id}`;
  return api.get(URL_API);
};

// Search lessons
export const searchLessonsApi = (search) => {
  const URL_API = `/lessons?search=${encodeURIComponent(search)}&limit=50`;
  return api.get(URL_API);
};

const lessonService = {
  getLessonApi,
  searchLessonsApi,
};

export default lessonService;