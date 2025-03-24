// frontend/src/redux/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

// 알림 목록 가져오기 thunk
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { getState, rejectWithValue, signal }) => {
    try {
      const { auth } = getState();
      if (!auth.user?.id) return rejectWithValue("사용자 정보 없음");

      // AbortController 신호 처리 추가
      const options = {};
      if (signal) options.signal = signal;

      const response = await fetchWithAuth(`${API_URL}notifications`, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`알림을 불러오는데 실패했습니다: ${errorText || response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('알림 목록 요청이 취소되었습니다.');
        return rejectWithValue('요청이 취소되었습니다.');
      }
      return rejectWithValue(error.message);
    }
  }
);

// 읽지 않은 알림 개수 가져오기 thunk
export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { getState, rejectWithValue, signal }) => {
    try {
      const { auth } = getState();
      if (!auth.user?.id) return rejectWithValue("사용자 정보 없음");

      // AbortController 신호 처리 추가
      const options = {};
      if (signal) options.signal = signal;

      const response = await fetchWithAuth(
        `${API_URL}notifications/unread-count`,
        options
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`읽지 않은 알림 개수를 불러오는데 실패했습니다: ${errorText || response.status}`);
      }
      const data = await response.json();
      return data.count;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('알림 개수 요청이 취소되었습니다.');
        return rejectWithValue('요청이 취소되었습니다.');
      }
      return rejectWithValue(error.message);
    }
  }
);

// 알림 읽음 처리 thunk
export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}notifications/${notificationId}/read`,
        {
          method: "PUT"
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`알림 읽음 처리에 실패했습니다: ${errorText || response.status}`);
      }
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 알림 삭제 thunk
export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}notifications/${notificationId}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`알림 삭제에 실패했습니다: ${errorText || response.status}`);
      }
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 알림 전송 thunk 추가
export const sendNotification = createAsyncThunk(
  "notifications/sendNotification",
  async ({ type, message, receiverId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const senderId = auth.user?.id;
      if (!senderId) return rejectWithValue("사용자 정보 없음");

      const notificationData = {
        type,
        message,
        senderId,
        receiverId: receiverId || null, // 특정 수신자가 없으면 null (관리자나 모든 사용자)
        timestamp: new Date().toISOString()
      };

      const response = await fetchWithAuth(`${API_URL}notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`알림 전송에 실패했습니다: ${errorText || response.status}`);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 초기 상태
const initialState = {
  items: [],
  realTimeNotifications: [], // 실시간 알림 배열 추가
  unreadCount: 0,
  loading: false,
  countLoading: false, // 개수 로딩 상태 분리
  sendingNotification: false, // 알림 전송 상태 추가
  error: null,
  lastRequestTimestamp: null // 마지막 요청 시간 추가
};

// 최대 요청 간격 (ms)
const MIN_REQUEST_INTERVAL = 2000; // 2초

// 알림 슬라이스
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // 실시간 알림 추가
    addRealTimeNotification: (state, action) => {
      state.realTimeNotifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    // 실시간 알림 초기화
    resetRealTimeNotifications: (state) => {
      state.realTimeNotifications = [];
    },
    // 로딩 상태 초기화 (무한 로딩 방지용)
    resetNotificationLoadingState: (state) => {
      state.loading = false;
      state.countLoading = false;
      state.sendingNotification = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 알림 목록 가져오기
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        // 최소 요청 간격 검사 (스로틀링)
        const now = Date.now();
        if (!state.lastRequestTimestamp || 
            (now - state.lastRequestTimestamp) > MIN_REQUEST_INTERVAL) {
          state.loading = true;
          state.error = null;
          state.lastRequestTimestamp = now;
        }
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        // 취소된 요청은 에러로 표시하지 않음
        if (action.payload !== '요청이 취소되었습니다.') {
          state.loading = false;
          state.error = action.payload;
        } else {
          state.loading = false;
        }
      });

    // 읽지 않은 알림 개수 가져오기
    builder
      .addCase(fetchUnreadCount.pending, (state) => {
        state.countLoading = true;
        state.error = null;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.countLoading = false;
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        // 취소된 요청은 에러로 표시하지 않음
        if (action.payload !== '요청이 취소되었습니다.') {
          state.countLoading = false;
          state.error = action.payload;
        } else {
          state.countLoading = false;
        }
      });
      
    // 알림 전송 상태 관리
    builder
      .addCase(sendNotification.pending, (state) => {
        state.sendingNotification = true;
        state.error = null;
      })
      .addCase(sendNotification.fulfilled, (state) => {
        state.sendingNotification = false;
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.sendingNotification = false;
        state.error = action.payload;
      });

    // 알림 읽음 처리
    builder
      .addCase(markAsRead.pending, (state) => {
        // 읽음 처리는 UI 블로킹 안 함
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        // 해당 알림의 isRead 상태 변경
        const notification = state.items.find(
          (item) => item.id === action.payload
        );
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload;
      });

    // 알림 삭제
    builder
      .addCase(deleteNotification.pending, (state) => {
        // 삭제 처리는 UI 블로킹 안 함
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        // 삭제된 알림을 목록에서 제거
        const index = state.items.findIndex(
          (item) => item.id === action.payload
        );
        if (index !== -1) {
          const wasUnread = !state.items[index].isRead;
          state.items.splice(index, 1);
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  addRealTimeNotification, 
  resetRealTimeNotifications,
  resetNotificationLoadingState
} = notificationSlice.actions;

export default notificationSlice.reducer;