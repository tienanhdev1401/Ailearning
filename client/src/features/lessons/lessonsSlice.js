import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

const initialTopicState = {
  items: [],
  page: 1,
  hasMore: true,
  status: 'idle',
  loadingMore: false,
  error: null,
  paramsKey: null,
};

const ensureTopicState = (state, topicKey) => {
  if (!state.topics[topicKey]) {
    state.topics[topicKey] = { ...initialTopicState };
  }
  return state.topics[topicKey];
};

export const fetchLessons = createAsyncThunk(
  'lessons/fetchLessons',
  async (args, { rejectWithValue }) => {
    const { topicType, sortBy, search, level, page, limit, topicKey } = args;
    try {
      const response = await api.get('/lessons', {
        params: {
          topic_type: topicType,
          sort: sortBy,
          search: search || undefined,
          level: level && level !== 'All' ? level : undefined,
          page,
          limit,
        },
      });

      return {
        topicKey,
        page,
        limit,
        data: response.data?.data || [],
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Không thể tải bài học';

      return rejectWithValue({ topicKey, message });
    }
  }
);

const lessonsSlice = createSlice({
  name: 'lessons',
  initialState: {
    topics: {},
  },
  reducers: {
    resetTopicState: (state, action) => {
      const { topicKey, paramsKey = null } = action.payload;
      state.topics[topicKey] = { ...initialTopicState, paramsKey };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLessons.pending, (state, action) => {
        const { topicKey, page, paramsKey } = action.meta.arg;
        const topicState = ensureTopicState(state, topicKey);
        topicState.paramsKey = paramsKey ?? topicState.paramsKey;
        topicState.error = null;
        if (page === 1) {
          topicState.status = 'loading';
          topicState.loadingMore = false;
        } else {
          topicState.loadingMore = true;
        }
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        const { topicKey, data, page, limit } = action.payload;
        const topicState = ensureTopicState(state, topicKey);
        if (topicState.paramsKey !== action.meta.arg.paramsKey) {
          return;
        }

        if (page === 1) {
          topicState.items = data;
        } else {
          topicState.items = [...topicState.items, ...data];
        }

        topicState.page = page + 1;
        topicState.hasMore = data.length === limit;
        topicState.status = 'succeeded';
        topicState.loadingMore = false;
        topicState.error = null;
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        const { topicKey, message } = action.payload || {};
        if (!topicKey) {
          return;
        }
        const topicState = ensureTopicState(state, topicKey);
        if (topicState.paramsKey !== action.meta.arg.paramsKey) {
          return;
        }
        topicState.status = 'failed';
        topicState.loadingMore = false;
        topicState.error = message || 'Không thể tải bài học';
      });
  },
});

export const { resetTopicState } = lessonsSlice.actions;

export const selectTopicState = (state, topicKey) =>
  state.lessons.topics[topicKey] || initialTopicState;

export const selectLessons = (state, topicKey) => {
  const topicState = selectTopicState(state, topicKey);
  return {
    items: topicState.items,
    page: topicState.page,
    hasMore: topicState.hasMore,
    status: topicState.status,
    loadingMore: topicState.loadingMore,
    error: topicState.error,
  };
};

export default lessonsSlice.reducer;
