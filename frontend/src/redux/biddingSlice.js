// src/redux/biddingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// 입찰 목록 조회 액션
export const fetchBiddings = createAsyncThunk(
  "bidding/fetchBiddings",
  async (params = {}, { rejectWithValue, signal }) => {
    try {
      // 쿼리 파라미터 구성
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);

      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_URL}biddings?${queryString}`
        : `${API_URL}biddings`;

      // AbortController 신호 처리 추가
      const options = {};
      if (signal) options.signal = signal;

      const response = await fetchWithAuth(endpoint, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `입찰 목록을 불러오는데 실패했습니다: ${errorText || response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        // 요청이 취소된 경우 처리
        console.log("입찰 목록 요청이 취소되었습니다.");
        return rejectWithValue("요청이 취소되었습니다.");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 입찰 상세 조회 액션
export const fetchBiddingDetail = createAsyncThunk(
  "bidding/fetchBiddingDetail",
  async (id, { rejectWithValue, signal }) => {
    try {
      // AbortController 신호 처리 추가
      const options = {};
      if (signal) options.signal = signal;

      const response = await fetchWithAuth(`${API_URL}biddings/${id}`, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `입찰 상세 정보를 불러오는데 실패했습니다: ${
            errorText || response.status
          }`
        );
      }
      return await response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("입찰 상세 요청이 취소되었습니다.");
        return rejectWithValue("요청이 취소되었습니다.");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 입찰 상태 변경 액션
export const updateBiddingStatus = createAsyncThunk(
  "bidding/updateStatus",
  async ({ id, previousStatus, newStatus, reason }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}biddings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fromStatus: previousStatus,
          toStatus: newStatus,
          reason: reason || "상태 변경"
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `입찰 상태 변경에 실패했습니다: ${errorText || response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 입찰 생성 액션
export const createBidding = createAsyncThunk(
  "bidding/createBidding",
  async (biddingData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}biddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(biddingData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `입찰 생성에 실패했습니다: ${errorText || response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 초기 상태
const initialState = {
  biddings: [],
  currentBidding: null,
  loading: false,
  detailLoading: false, // 상세 정보 로딩 상태 분리
  error: null,
  statusOptions: [
    { value: "PENDING", label: "대기중" },
    { value: "ONGOING", label: "진행중" },
    { value: "CLOSED", label: "마감" },
    { value: "CANCELED", label: "취소" }
  ]
};

// 입찰 슬라이스
const biddingSlice = createSlice({
  name: "bidding",
  initialState,
  reducers: {
    // WebSocket을 통한 상태 업데이트를 위한 리듀서
    updateBiddingStatusWebSocket: (state, action) => {
      const { id, previousStatus, newStatus } = action.payload;
      // 목록에서 해당 입찰 항목 업데이트
      state.biddings = state.biddings.map((bidding) => {
        if (bidding.id === id) {
          return {
            ...bidding,
            status: newStatus,
            statusName:
              state.statusOptions.find((option) => option.value === newStatus)
                ?.label || newStatus
          };
        }
        return bidding;
      });

      // 현재 보고 있는 입찰인 경우 현재 입찰 정보도 업데이트
      if (state.currentBidding?.id === id) {
        state.currentBidding = {
          ...state.currentBidding,
          status: newStatus,
          statusName:
            state.statusOptions.find((option) => option.value === newStatus)
              ?.label || newStatus
        };
      }
    },
    // 현재 입찰 정보 초기화
    clearCurrentBidding: (state) => {
      state.currentBidding = null;
    },
    // 로딩 상태 초기화 (무한 로딩 방지용)
    resetLoadingState: (state) => {
      state.loading = false;
      state.detailLoading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 입찰 목록 조회
      .addCase(fetchBiddings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBiddings.fulfilled, (state, action) => {
        state.loading = false;
        state.biddings = action.payload;
      })
      .addCase(fetchBiddings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 입찰 상세 조회 - 별도의 로딩 상태 사용
      .addCase(fetchBiddingDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchBiddingDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentBidding = action.payload;
      })
      .addCase(fetchBiddingDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // 입찰 상태 변경
      .addCase(updateBiddingStatus.pending, (state) => {
        // 상태 변경은 전체 로딩 상태를
        // 방해하지 않도록 따로 처리 (무한 로딩 방지)
        state.error = null;
      })
      .addCase(updateBiddingStatus.fulfilled, (state, action) => {
        // 해당 입찰 항목 업데이트
        state.biddings = state.biddings.map((bidding) =>
          bidding.id === action.payload.id ? action.payload : bidding
        );
        // 현재 보고 있는 입찰인 경우 현재 입찰 정보도 업데이트
        if (state.currentBidding?.id === action.payload.id) {
          state.currentBidding = action.payload;
        }
      })
      .addCase(updateBiddingStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      // 입찰 생성
      .addCase(createBidding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBidding.fulfilled, (state, action) => {
        state.loading = false;
        state.biddings.push(action.payload);
        state.currentBidding = action.payload;
      })
      .addCase(createBidding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  updateBiddingStatusWebSocket,
  clearCurrentBidding,
  resetLoadingState
} = biddingSlice.actions;
export default biddingSlice.reducer;
