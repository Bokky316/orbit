import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/**
 * 구매 요청 목록을 가져오는 비동기 액션
 */
export const fetchPurchaseRequests = createAsyncThunk(
  "purchaseRequest/fetchPurchaseRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}purchase-requests`);

      // HTML 응답 방지 처리
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json(); // JSON 파싱 시도
        throw new Error(errorData.message || "Unknown error");
      }

      return await response.json();
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }
      return rejectWithValue(error.message);
    }
  }
);

// 아이템 목록 조회 액션
export const fetchItems = createAsyncThunk(
  "purchaseRequest/fetchItems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}purchase-requests/items`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "아이템 조회 실패");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 카테고리 목록 조회 액션 추가
export const fetchCategories = createAsyncThunk(
  "purchaseRequest/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/categories`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "카테고리 조회 실패");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deletePurchaseRequest = createAsyncThunk(
  "purchaseRequest/delete",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/${id}`,
        {
          method: "DELETE"
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${errorText || "구매요청 삭제 실패"}`);
      }
      return id;
    } catch (error) {
      console.error("구매요청 삭제 중 오류 발생:", error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 구매 요청을 생성하는 비동기 액션
 */
export const createPurchaseRequest = createAsyncThunk(
  "purchaseRequest/create",
  async (formData, { rejectWithValue }) => {
    // FormData 직접 처리
    try {
      const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
        method: "POST",
        body: formData // 헤더 설정 제거 (브라우저가 자동 설정)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "생성 실패");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

/**
 * [신규 추가] 실시간 상태 업데이트 웹소켓 미들웨어
 */
const createWebsocketMiddleware = () => {
  let socket = null;
  let stompClient = null;

  return ({ dispatch }) =>
    (next) =>
    (action) => {
      switch (action.type) {
        case "WS_CONNECT":
          if (!socket) {
            socket = new SockJS(`${SERVER_URL}ws`);
            stompClient = Stomp.over(socket);

            stompClient.connect({}, function (frame) {
              dispatch({ type: "WS_CONNECTED" });

              // 특정 구매요청의 상태 변경 구독
              stompClient.subscribe(
                `/topic/purchase-request/{id}`,
                function (message) {
                  const data = JSON.parse(message.body);
                  dispatch({
                    type: "purchaseRequest/wsUpdate",
                    payload: data
                  });
                }
              );
            });
          }
          break;

        case "WS_DISCONNECT":
          if (stompClient) {
            stompClient.disconnect();
            socket = null;
            stompClient = null;
          }
          break;

        case "purchaseRequest/changeStatus":
          if (stompClient) {
            stompClient.send(
              "/app/purchase-request/{id}/status",
              {},
              JSON.stringify(action.payload)
            );
          }
          break;

        default:
          return next(action);
      }
    };
};

// 상태 변경 액션 추가
export const changePurchaseRequestStatus = createAsyncThunk(
  "purchaseRequest/changeStatus",
  async ({ id, fromStatus, toStatus }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ fromStatus, toStatus })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "상태 변경 실패");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 파일 다운로드 액션 추가
export const downloadAttachment = createAsyncThunk(
  "purchaseRequest/downloadAttachment",
  async (attachmentId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/attachments/${attachmentId}/download`,
        { responseType: "blob" }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`서버 응답 오류 (${response.status}): ${error}`);
      }

      // 헤더에서 파일명 추출
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "unnamed_file";

      return {
        blob: await response.blob(),
        fileName: decodeURIComponent(fileName)
      };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

/**
 * 구매 요청을 수정하는 비동기 액션
 */
export const updatePurchaseRequest = createAsyncThunk(
  "purchaseRequest/updatePurchaseRequest", // 액션 타입 정의
  async ({ id, requestData }, { rejectWithValue }) => {
    try {
      // API_URL/purchase-requests/{id} 엔드포인트로 PUT 요청을 보냄 (JWT 인증 사용)
      const response = await fetchWithAuth(
        `${API_URL}purchase-requests/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json" // 요청 본문의 Content-Type 설정
          },
          body: JSON.stringify(requestData) // 요청 본문을 JSON 문자열로 변환
        }
      );

      // 응답이 성공적인지 확인
      if (!response.ok) {
        // 응답이 실패하면 에러 메시지를 포함한 에러 객체를 생성하고 rejectWithValue를 호출
        const errorText = await response.text();
        throw new Error(
          `Failed to update purchase request: ${response.status} - ${errorText}`
        );
      }

      // 응답이 성공하면 JSON 형태로 파싱하여 반환
      const data = await response.json();
      return data;
    } catch (error) {
      // 에러가 발생하면 콘솔에 로깅하고 rejectWithValue를 호출하여 에러를 반환
      console.error("Error updating purchase request:", error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 초기 상태 정의
 */
const initialState = {
  purchaseRequests: [],
  currentRequest: null, // 단일 조회 데이터
  websocketStatus: "disconnected", // 웹소켓 연결 상태
  loading: false,
  error: null,
  filters: {
    searchTerm: "",
    requestDate: "",
    status: ""
  },
  items: [],
  categories: [] // 카테고리 목록 추가
};

/**
 * 슬라이스 생성
 */
const purchaseRequestSlice = createSlice({
  name: "purchaseRequest", // 슬라이스 이름 정의
  initialState, // 초기 상태 설정
  reducers: {
    /**
     * 구매 요청 목록 설정 액션
     */
    setPurchaseRequests: (state, action) => {
      state.purchaseRequests = action.payload;
    },
    /**
     * 검색어 설정 액션
     */
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    // webSocket
    setWebsocketStatus: (state, action) => {
      state.websocketStatus = action.payload;
    },
    /**
     * 요청일 설정 액션
     */
    setRequestDate: (state, action) => {
      state.filters.requestDate = action.payload;
    },
    /**
     * 상태 설정 액션
     */
    setStatus: (state, action) => {
      state.filters.status = action.payload;
    }
  },
  extraReducers: (builder) => {
      builder
        // fetchPurchaseRequests 액션 처리
        .addCase(fetchPurchaseRequests.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchPurchaseRequests.fulfilled, (state, action) => {
          state.loading = false;
          state.purchaseRequests = action.payload;
        })
        .addCase(fetchPurchaseRequests.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        // createPurchaseRequest 액션 처리
        .addCase(createPurchaseRequest.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createPurchaseRequest.fulfilled, (state, action) => {
          state.loading = false;
          state.purchaseRequests.push(action.payload); // 새로운 구매 요청을 목록에 추가
        })
        .addCase(createPurchaseRequest.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        // updatePurchaseRequest 액션 처리
        .addCase(updatePurchaseRequest.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(updatePurchaseRequest.fulfilled, (state, action) => {
          state.loading = false;
          state.purchaseRequests = state.purchaseRequests.map((request) =>
            request.id === action.payload.id ? action.payload : request
          ); // 구매 요청 업데이트
        })
        // extraReducers에 추가
        .addCase(deletePurchaseRequest.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(deletePurchaseRequest.fulfilled, (state, action) => {
          state.loading = false;
          state.purchaseRequests = state.purchaseRequests.filter(
            (request) => request.id !== action.payload
          );
        })
        .addCase(deletePurchaseRequest.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        // fetchItems 액션 처리
        .addCase(fetchItems.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchItems.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchItems.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })

        // fetchCategories 액션 처리 (추가)
        .addCase(fetchCategories.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchCategories.fulfilled, (state, action) => {
          state.loading = false;
          state.categories = action.payload;
        })
        .addCase(fetchCategories.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        .addCase(updatePurchaseRequest.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
        })
        // WebSocket 메시지 처리를 위한 액션 추가
        .addCase("purchaseRequest/wsUpdate", (state, action) => {
          const updatedData = action.payload;
          console.log('🔄 WebSocket 업데이트 처리:', updatedData);

          // 상태 코드 추출 함수
          const extractStatusCode = (statusStr) => {
            if (!statusStr) return null;
            const parts = String(statusStr).split('-');
            return parts.length >= 3 ? parts[2] : statusStr;
          };

          // 업데이트할 데이터 준비
          const statusCode = updatedData.prStatusChild || extractStatusCode(updatedData.status) || updatedData.toStatus;
          const requestId = updatedData.id || updatedData.purchaseRequestId;

          console.log(`🔄 추출된 상태 코드: ${statusCode}, 요청 ID: ${requestId}`);

          if (!requestId) {
            console.error('❌ 유효한 요청 ID가 없습니다:', updatedData);
            return;
          }

          // 구매요청 목록 업데이트
          if (state.purchaseRequests && state.purchaseRequests.length > 0) {
            state.purchaseRequests = state.purchaseRequests.map((request) => {
              if (request.id === requestId) {
                console.log(`🔄 구매요청 #${request.id} 상태 업데이트: ${request.prStatusChild} -> ${statusCode}`);
                return {
                  ...request,
                  prStatusChild: statusCode,
                  status: updatedData.status || request.status
                };
              }
              return request;
            });
          }

          // 현재 보고 있는 구매요청이 업데이트 대상이면 함께 업데이트
          if (state.currentRequest && state.currentRequest.id === requestId) {
            console.log(`🔄 현재 보고 있는 구매요청 상태 업데이트: ${state.currentRequest.prStatusChild} -> ${statusCode}`);
            state.currentRequest = {
              ...state.currentRequest,
              prStatusChild: statusCode,
              status: updatedData.status || state.currentRequest.status
            };
          }
        })
        // changePurchaseRequestStatus 액션 처리
        .addCase(changePurchaseRequestStatus.pending, (state) => {
          state.loading = true;
        })
        .addCase(changePurchaseRequestStatus.fulfilled, (state, action) => {
          const { id, toStatus } = action.payload;
          state.loading = false;

          // 구매요청 목록에서 상태 업데이트
          if (state.purchaseRequests && state.purchaseRequests.length > 0) {
            state.purchaseRequests = state.purchaseRequests.map(request =>
              request.id === id
                ? { ...request, prStatusChild: toStatus }
                : request
            );
          }

          // 현재 보고 있는 구매요청인 경우 업데이트
          if (state.currentRequest && state.currentRequest.id === id) {
            state.currentRequest = {
              ...state.currentRequest,
              prStatusChild: toStatus
            };
          }

          console.log(`💾 구매요청 ${id}의 상태가 ${toStatus}로 변경되었습니다.`);
        })
        .addCase(changePurchaseRequestStatus.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload;
          console.error('❌ 상태 변경 실패:', action.payload);
        });
    }
});

export const websocketMiddleware = createWebsocketMiddleware();

export const { setSearchTerm, setRequestDate, setStatus, setWebsocketStatus } =
  purchaseRequestSlice.actions;

export default purchaseRequestSlice.reducer;