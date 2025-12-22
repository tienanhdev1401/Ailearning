import api from '../../api/api';

// Get lesson by id
export const getLessonApi = (id) => {
  const URL_API = `/lessons/${id}`;
  return api.get(URL_API);
};

const lessonService = {
  getLessonApi,
};

export default lessonService;