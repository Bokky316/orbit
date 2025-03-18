// src/redux/approvalSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import {
  fetchPendingApprovals,
  fetchCompletedApprovals
} from "@/utils/approvalUtils";

/**
 * 결재 목록을 가져오는 비동기 액션
 */
export const fetchApprovals = createAsyncThunk(
  "approval/fetchApprovals",
  async (_, { rejectWithValue }) => {
    try {
      // 내 결재 대기 목록 조회 (현재 사용자가 결재해야 할 항목)
      const response = await fetchWithAuth(`${API_URL}approvals/my-approvals`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `결재 목록 조회 실패: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("결재 목록 조회 중 오류 발생:", error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 특정 구매요청에 대한 결재선 목록 조회
 */
export const fetchApprovalLines = createAsyncThunk(
  "approval/fetchApprovalLines",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}approvals/${requestId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 조회 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return { requestId, lines: data };
    } catch (error) {
      console.error("결재선 조회 중 오류 발생:", error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 결재선 생성
 */
export const createApprovalLine = createAsyncThunk(
  "approval/createApprovalLine",
  async (approvalLineData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}approvals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(approvalLineData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 생성 실패: ${response.status} - ${errorText}`);
      }

      return approvalLineData.purchaseRequestId;
    } catch (error) {
      console.error("결재선 생성 중 오류 발생:", error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 결재 처리 (승인/반려)
 */
export const processApproval = createAsyncThunk(
  "approval/processApproval",
  async ({ lineId, action, comment, nextStatusCode }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}approvals/${lineId}/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action,
            comment,
            nextStatusCode
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재 처리 실패: ${response.status} - ${errorText}`);
      }

      return { lineId, action };
    } catch (error) {
      console.error("결재 처리 중 오류 발생:", error);
      return rejectWithValue(error.message);
    }
  }
);
// 결재 대기 목록 조회 액션
export const fetchPendingApprovalsAction = createAsyncThunk(
  "approval/fetchPendingApprovals",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchPendingApprovals();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 결재 완료 목록 조회 액션
export const fetchCompletedApprovalsAction = createAsyncThunk(
  "approval/fetchCompletedApprovals",
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchCompletedApprovals();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 이전 코드의 나머지 부분 유지 (초기 상태, 리듀서 등)
const initialState = {
  approvals: [],
  approvalLines: {},
  pendingApprovals: [],
  completedApprovals: [],
  filters: {
    searchTerm: "",
    requestDate: "",
    businessType: "ALL"
  },
  loading: false,
  error: null
};

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    setApprovals: (state, action) => {
      state.approvals = action.payload;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    setRequestDate: (state, action) => {
      state.filters.requestDate = action.payload;
    },
    setBusinessType: (state, action) => {
      state.filters.businessType = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchApprovals 액션 처리
      .addCase(fetchApprovals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovals.fulfilled, (state, action) => {
        state.loading = false;
        state.approvals = action.payload;
      })
      .addCase(fetchApprovals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchApprovalLines 액션 처리
      .addCase(fetchApprovalLines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalLines.fulfilled, (state, action) => {
        state.loading = false;
        state.approvalLines = {
          ...state.approvalLines,
          [action.payload.requestId]: action.payload.lines
        };
      })
      .addCase(fetchApprovalLines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createApprovalLine 액션 처리
      .addCase(createApprovalLine.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createApprovalLine.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createApprovalLine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // processApproval 액션 처리
      .addCase(processApproval.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processApproval.fulfilled, (state, action) => {
        state.loading = false;

        // 해당 결재선의 상태 업데이트
        const { lineId, action: approvalAction } = action.payload;
        state.approvals = state.approvals.filter(
          (approval) => approval.id !== lineId
        );
      })
      .addCase(processApproval.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchPendingApprovalsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovalsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingApprovals = action.payload;
      })
      .addCase(fetchPendingApprovalsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCompletedApprovalsAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompletedApprovalsAction.fulfilled, (state, action) => {
        state.loading = false;
        state.completedApprovals = action.payload;
      })
      .addCase(fetchCompletedApprovalsAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setApprovals,
  setSearchTerm,
  setRequestDate,
  setBusinessType,
  clearError
} = approvalSlice.actions;

export default approvalSlice.reducer;
