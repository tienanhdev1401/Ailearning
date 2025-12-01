import { configureStore } from '@reduxjs/toolkit';
import lessonsReducer from '../features/lessons/lessonsSlice';

const store = configureStore({
  reducer: {
    lessons: lessonsReducer,
  },
});

export default store;
