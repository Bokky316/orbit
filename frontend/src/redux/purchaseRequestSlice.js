// src/redux/purchaseRequestSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 구매 요청 목록을 가져오는 비동기 액션
 */
export const fetchPurchaseRequests = createAsyncThunk(
    'purchaseRequest/fetchPurchaseRequests',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'GET',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch purchase requests: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching purchase requests:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 구매 요청을 생성하는 비동기 액션
 */
/**
 * 구매 요청을 생성하는 비동기 액션
 */
export const createPurchaseRequest = createAsyncThunk(
    'purchaseRequest/createPurchaseRequest',
    async (requestData, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}purchase-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create purchase request: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating purchase request:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 구매 요청을 수정하는 비동기 액션
 */
export const updatePurchaseRequest = createAsyncThunk(
    'purchaseRequest/updatePurchaseRequest',
    async ({ id, requestData }, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}purchase-requests/${id}`, {
                method: 'PUT',
                body: JSON.stringify(requestData),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update purchase request: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating purchase request:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 초기 상태 정의
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
    name: 'purchaseRequest',
    initialState,
    reducers: {
        setPurchaseRequests: (state, action) => {
            state.purchaseRequests = action.payload;
        },
        setSearchTerm: (state, action) => {
            state.filters.searchTerm = action.payload;
        },
        setRequestDate: (state, action) => {
            state.filters.requestDate = action.payload;
        },
        setStatus: (state, action) => {
            state.filters.status = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
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
    setPurchaseRequests,
    setSearchTerm,
    setRequestDate,
    setStatus
} = purchaseRequestSlice.actions;

export default purchaseRequestSlice.reducer;
