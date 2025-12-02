import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchTopicLessonOverview = createAsyncThunk(
  'topicLessonOverview/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/lessons/latest-per-type');
      return response.data || {};
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Không thể tải danh sách chủ đề';
      return rejectWithValue(message);
    }
  }
);

const topicLessonOverviewSlice = createSlice({
  name: 'topicOverview',
  initialState: {
    data: {},
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopicLessonOverview.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTopicLessonOverview.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload || {};
        state.error = null;
      })
      .addCase(fetchTopicLessonOverview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Không thể tải danh sách chủ đề';
      });
  },
});

export const selectTopicLessonOverviewState = (state) => state.topicLessonOverview;

export default topicLessonOverviewSlice.reducer;

