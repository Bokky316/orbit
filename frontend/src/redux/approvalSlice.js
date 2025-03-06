// src/redux/approvalSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 결재 목록을 가져오는 비동기 액션
 */
export const fetchApprovals = createAsyncThunk(
    'approval/fetchApprovals',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}approvals`, {
                method: 'GET',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch approvals: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching approvals:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 결재를 승인하는 비동기 액션
 */
export const approveApproval = createAsyncThunk(
    'approval/approveApproval',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}approvals/${id}/approve`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to approve approval: ${response.status} - ${errorText}`);
            }
            return id; // 성공 시 ID 반환
        } catch (error) {
            console.error('Error approving approval:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 결재를 거절하는 비동기 액션
 */
export const rejectApproval = createAsyncThunk(
    'approval/rejectApproval',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}approvals/${id}/reject`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to reject approval: ${response.status} - ${errorText}`);
            }
            return id; // 성공 시 ID 반환
        } catch (error) {
            console.error('Error rejecting approval:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 초기 상태 정의
 */
const initialState = {
    approvals: [],
    filters: {
        searchTerm: '',
        requestDate: ''
    },
    loading: false,
    error: null
};

/**
 * 슬라이스 생성
 */
const approvalSlice = createSlice({
    name: 'approval',
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
        }
    },
    extraReducers: (builder) => {
        builder
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
            .addCase(approveApproval.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(approveApproval.fulfilled, (state, action) => {
                state.loading = false;
                state.approvals = state.approvals.map(approval =>
                    approval.id === action.payload ? { ...approval, status: '승인' } : approval
                ); // 상태 업데이트
            })
            .addCase(approveApproval.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(rejectApproval.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(rejectApproval.fulfilled, (state, action) => {
                state.loading = false;
                state.approvals = state.approvals.map(approval =>
                    approval.id === action.payload ? { ...approval, status: '거절' } : approval
                ); // 상태 업데이트
            })
            .addCase(rejectApproval.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    setApprovals,
    setSearchTerm,
    setRequestDate
} = approvalSlice.actions;

export default approvalSlice.reducer;
