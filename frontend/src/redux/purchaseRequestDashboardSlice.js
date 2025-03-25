// src/redux/purchaseRequestDashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { API_URL } from '../utils/constants';

// API 경로 정의
const DASHBOARD_URL = `${API_URL}purchase-requests/dashboard`;

// 대시보드 데이터 조회
export const fetchDashboardData = createAsyncThunk(
  'purchaseRequestDashboard/fetchDashboardData',
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

// 필터링된 구매요청 목록 조회
export const fetchFilteredRequests = createAsyncThunk(
  'purchaseRequestDashboard/fetchFilteredRequests',
  async (filters, { rejectWithValue }) => {
    try {
      // URL 쿼리 파라미터 구성
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.department) params.append('department', filters.department);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.projectId) params.append('projectId', filters.projectId);
      if (filters.businessType) params.append('businessType', filters.businessType);

      const queryString = params.toString();
      const url = `${DASHBOARD_URL}/filter${queryString ? `?${queryString}` : ''}`;

      const response = await fetchWithAuth(url);
      if (!response.ok) {
        return rejectWithValue('필터링된 구매요청 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 프로젝트별 구매요청 목록 조회
export const fetchRequestsByProject = createAsyncThunk(
  'purchaseRequestDashboard/fetchRequestsByProject',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${DASHBOARD_URL}/by-project/${projectId}`);
      if (!response.ok) {
        return rejectWithValue('프로젝트별 구매요청 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 구매요청 진행 상태 조회
export const fetchRequestProgress = createAsyncThunk(
  'purchaseRequestDashboard/fetchRequestProgress',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${DASHBOARD_URL}/${requestId}/progress`);
      if (!response.ok) {
        return rejectWithValue('구매요청 진행 상태를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 전체 부서 목록 조회
export const fetchAllDepartments = createAsyncThunk(
  'purchaseRequestDashboard/fetchAllDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${DASHBOARD_URL}/departments`);
      if (!response.ok) {
        return rejectWithValue('부서 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 전체 상태 목록 조회
export const fetchAllStatusCodes = createAsyncThunk(
  'purchaseRequestDashboard/fetchAllStatusCodes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${DASHBOARD_URL}/statuses`);
      if (!response.ok) {
        return rejectWithValue('상태 코드 목록을 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 웹소켓 업데이트 처리 액션
export const receiveWebsocketUpdate = (updateData) => ({
  type: 'purchaseRequestDashboard/receiveWebsocketUpdate',
  payload: updateData
});

const initialState = {
  dashboard: {
    totalCount: 0,
    countByStatus: {},
    budgetByStatus: {},
    countByDepartment: {},
    budgetByDepartment: {},
    recentRequests: [],
    pendingRequests: [],
    totalBudget: 0,
    completedBudget: 0,
    pendingBudget: 0
  },
  filteredRequests: [],
  projectRequests: [],
  requestProgress: null,
  departments: [],
  statusCodes: [],
  loading: false,
  error: null
};

const purchaseRequestDashboardSlice = createSlice({
  name: 'purchaseRequestDashboard',
  initialState,
  reducers: {
    resetFilteredRequests: (state) => {
      state.filteredRequests = [];
    },
    resetProjectRequests: (state) => {
      state.projectRequests = [];
    },
    // 웹소켓을 통한 업데이트 처리
    wsUpdate: (state, action) => {
      // 웹소켓 메시지에 따라 상태 업데이트
      const { type, data } = action.payload;

      if (type === 'dashboard' && data) {
        // 대시보드 전체 데이터 업데이트
        state.dashboard = data;
      } else if (type === 'progress' && data && state.requestProgress?.requestNumber === data.requestNumber) {
        // 진행 상태 업데이트
        state.requestProgress = data;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // 대시보드 데이터 조회
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.dashboard = action.payload;
        state.loading = false;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '대시보드 데이터를 불러오는 중 오류가 발생했습니다.';
      })

      // 필터링된 구매요청 목록 조회
      .addCase(fetchFilteredRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredRequests.fulfilled, (state, action) => {
        state.filteredRequests = action.payload;
        state.loading = false;
      })
      .addCase(fetchFilteredRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '필터링된 구매요청 목록을 불러오는 중 오류가 발생했습니다.';
      })

      // 프로젝트별 구매요청 목록 조회
      .addCase(fetchRequestsByProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestsByProject.fulfilled, (state, action) => {
        state.projectRequests = action.payload;
        state.loading = false;
      })
      .addCase(fetchRequestsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '프로젝트별 구매요청 목록을 불러오는 중 오류가 발생했습니다.';
      })

      // 구매요청 진행 상태 조회
      .addCase(fetchRequestProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestProgress.fulfilled, (state, action) => {
        state.requestProgress = action.payload;
        state.loading = false;
      })
      .addCase(fetchRequestProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '구매요청 진행 상태를 불러오는 중 오류가 발생했습니다.';
      })

      // 전체 부서 목록 조회
      .addCase(fetchAllDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '부서 목록을 불러오는 중 오류가 발생했습니다.';
      })

      // 전체 상태 목록 조회
      .addCase(fetchAllStatusCodes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllStatusCodes.fulfilled, (state, action) => {
        state.statusCodes = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllStatusCodes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '상태 코드 목록을 불러오는 중 오류가 발생했습니다.';
      });
  }
});

// 웹소켓 미들웨어
export const websocketMiddleware = store => next => action => {
  if (action.type === 'purchaseRequestDashboard/receiveWebsocketUpdate') {
    // 웹소켓 메시지 처리
    store.dispatch(purchaseRequestDashboardSlice.actions.wsUpdate(action.payload));
  }
  return next(action);
};

export const { resetFilteredRequests, resetProjectRequests, wsUpdate } = purchaseRequestDashboardSlice.actions;
export default purchaseRequestDashboardSlice.reducer;