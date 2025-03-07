import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 구매 요청 목록을 가져오는 비동기 액션
 *
 * @function fetchPurchaseRequests
 * @param {void} _ - 사용하지 않는 파라미터 (관례적으로 _ 로 표시)
 * @param {object} thunkAPI - Redux Toolkit에서 제공하는 thunk API 객체
 * @returns {Promise<Array<PurchaseRequest>>} 구매 요청 목록을 담은 Promise
 * @throws {Error} 구매 요청 목록을 가져오는 데 실패한 경우
 */
export const fetchPurchaseRequests = createAsyncThunk(
    'purchaseRequest/fetchPurchaseRequests', // 액션 타입 정의
    async (_, { rejectWithValue }) => {
        try {
            // API_URL/purchase-requests 엔드포인트로 GET 요청을 보냄 (JWT 인증 사용)
            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'GET',
            });

            // 응답이 성공적인지 확인
            if (!response.ok) {
                // 응답이 실패하면 에러 메시지를 포함한 에러 객체를 생성하고 rejectWithValue를 호출
                const errorText = await response.text();
                throw new Error(`Failed to fetch purchase requests: ${response.status} - ${errorText}`);
            }

            // 응답이 성공하면 JSON 형태로 파싱하여 반환
            const data = await response.json();
            return data;
        } catch (error) {
            // 에러가 발생하면 콘솔에 로깅하고 rejectWithValue를 호출하여 에러를 반환
            console.error('Error fetching purchase requests:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 구매 요청을 생성하는 비동기 액션
 *
 * @function createPurchaseRequest
 * @param {PurchaseRequest} requestData - 생성할 구매 요청 데이터
 * @param {object} thunkAPI - Redux Toolkit에서 제공하는 thunk API 객체
 * @returns {Promise<PurchaseRequest>} 생성된 구매 요청을 담은 Promise
 * @throws {Error} 구매 요청을 생성하는 데 실패한 경우
 */
export const createPurchaseRequest = createAsyncThunk(
    'purchaseRequest/createPurchaseRequest', // 액션 타입 정의
    async (requestData, { rejectWithValue }) => {
        try {
            // API_URL/purchase-requests 엔드포인트로 POST 요청을 보냄 (JWT 인증 사용)
            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // 요청 본문의 Content-Type 설정
                },
                body: JSON.stringify(requestData) // 요청 본문을 JSON 문자열로 변환
            });

            // 응답이 성공적인지 확인
            if (!response.ok) {
                // 응답이 실패하면 에러 메시지를 포함한 에러 객체를 생성하고 rejectWithValue를 호출
                const errorText = await response.text();
                throw new Error(`Failed to create purchase request: ${response.status} - ${errorText}`);
            }

            // 응답이 성공하면 JSON 형태로 파싱하여 반환
            const data = await response.json();
            return data;
        } catch (error) {
            // 에러가 발생하면 콘솔에 로깅하고 rejectWithValue를 호출하여 에러를 반환
            console.error('Error creating purchase request:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 구매 요청을 수정하는 비동기 액션
 *
 * @function updatePurchaseRequest
 * @param {object} payload - 수정할 구매 요청 ID와 데이터
 * @param {number} payload.id - 수정할 구매 요청 ID
 * @param {PurchaseRequest} payload.requestData - 수정할 구매 요청 데이터
 * @param {object} thunkAPI - Redux Toolkit에서 제공하는 thunk API 객체
 * @returns {Promise<PurchaseRequest>} 수정된 구매 요청을 담은 Promise
 * @throws {Error} 구매 요청을 수정하는 데 실패한 경우
 */
export const updatePurchaseRequest = createAsyncThunk(
    'purchaseRequest/updatePurchaseRequest', // 액션 타입 정의
    async ({ id, requestData }, { rejectWithValue }) => {
        try {
            // API_URL/purchase-requests/{id} 엔드포인트로 PUT 요청을 보냄 (JWT 인증 사용)
            const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json' // 요청 본문의 Content-Type 설정
                },
                body: JSON.stringify(requestData), // 요청 본문을 JSON 문자열로 변환
            });

            // 응답이 성공적인지 확인
            if (!response.ok) {
                // 응답이 실패하면 에러 메시지를 포함한 에러 객체를 생성하고 rejectWithValue를 호출
                const errorText = await response.text();
                throw new Error(`Failed to update purchase request: ${response.status} - ${errorText}`);
            }

            // 응답이 성공하면 JSON 형태로 파싱하여 반환
            const data = await response.json();
            return data;
        } catch (error) {
            // 에러가 발생하면 콘솔에 로깅하고 rejectWithValue를 호출하여 에러를 반환
            console.error('Error updating purchase request:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 초기 상태 정의
 *
 * @typedef {object} PurchaseRequestState
 * @property {Array<PurchaseRequest>} purchaseRequests - 구매 요청 목록
 * @property {object} filters - 필터 정보
 * @property {string} filters.searchTerm - 검색어
 * @property {string} filters.requestDate - 요청일
 * @property {string} filters.status - 상태
 * @property {boolean} loading - 로딩 상태
 * @property {string | null} error - 에러 메시지
 */
const initialState = {
    purchaseRequests: [],
    filters: {
        searchTerm: '',
        requestDate: '',
        status: ''
    },
    loading: false,
    error: null
};

/**
 * 슬라이스 생성
 */
const purchaseRequestSlice = createSlice({
    name: 'purchaseRequest', // 슬라이스 이름 정의
    initialState, // 초기 상태 설정
    reducers: {
        /**
         * 구매 요청 목록 설정 액션
         *
         * @param {PurchaseRequestState} state - 현재 상태
         * @param {object} action - 액션 객체
         * @param {Array<PurchaseRequest>} action.payload - 설정할 구매 요청 목록
         */
        setPurchaseRequests: (state, action) => {
            state.purchaseRequests = action.payload;
        },
        /**
         * 검색어 설정 액션
         *
         * @param {PurchaseRequestState} state - 현재 상태
         * @param {object} action - 액션 객체
         * @param {string} action.payload - 설정할 검색어
         */
        setSearchTerm: (state, action) => {
            state.filters.searchTerm = action.payload;
        },
        /**
         * 요청일 설정 액션
         *
         * @param {PurchaseRequestState} state - 현재 상태
         * @param {object} action - 액션 객체
         * @param {string} action.payload - 설정할 요청일
         */
        setRequestDate: (state, action) => {
            state.filters.requestDate = action.payload;
        },
        /**
         * 상태 설정 액션
         *
         * @param {PurchaseRequestState} state - 현재 상태
         * @param {object} action - 액션 객체
         * @param {string} action.payload - 설정할 상태
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
                state.purchaseRequests = state.purchaseRequests.map(request =>
                    request.id === action.payload.id ? action.payload : request
                ); // 구매 요청 업데이트
            })
            .addCase(updatePurchaseRequest.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setSearchTerm,
    setRequestDate,
    setStatus
} = purchaseRequestSlice.actions;

export default purchaseRequestSlice.reducer;
