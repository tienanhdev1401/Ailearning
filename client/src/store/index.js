import { configureStore } from '@reduxjs/toolkit';
import lessonsReducer from '../features/lessons/lessonsSlice';
import topicLessonOverviewReducer from '../features/lessons/topicLessonOverviewSlice';

const store = configureStore({
  reducer: {
    lessons: lessonsReducer,
    topicLessonOverview: topicLessonOverviewReducer,
  },
});

export default store;
