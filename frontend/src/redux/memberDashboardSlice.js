// src/redux/memberDashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { API_URL } from '../utils/constants';

// API 경로 정의
const DASHBOARD_URL = `${API_URL}dashboard/me`;

// 멤버 대시보드 데이터 조회
export const fetchMemberDashboardData = createAsyncThunk(
  'memberDashboard/fetchMemberDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(DASHBOARD_URL);
      if (!response.ok) {
        return rejectWithValue('대시보드 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 초기 상태 정의
const initialState = {
  dashboard: {
    memberInfo: {},
    purchaseRequestStats: {},
    recentRequests: [],
    pendingApprovals: [],
    notifications: [],
    recentActivities: []
  },
  loading: false,
  error: null
};

// 리덕스 슬라이스 생성
const memberDashboardSlice = createSlice({
  name: 'memberDashboard',
  initialState,
  reducers: {
    // 추가적인 리듀서가 필요할 경우 여기에 정의
    resetDashboardState: (state) => {
      state.dashboard = initialState.dashboard;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 대시보드 데이터 조회
      .addCase(fetchMemberDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberDashboardData.fulfilled, (state, action) => {
        state.dashboard = action.payload;
        state.loading = false;
      })
      .addCase(fetchMemberDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '대시보드 데이터를 불러오는 중 오류가 발생했습니다.';
      });
  }
});

export const { resetDashboardState } = memberDashboardSlice.actions;
export default memberDashboardSlice.reducer;