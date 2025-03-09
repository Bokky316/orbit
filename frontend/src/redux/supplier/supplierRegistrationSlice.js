import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

/**
 * 협력업체 목록을 가져오는 비동기 액션
 *
 * @function fetchSupplierRegistrations
 * @returns {Promise<Array<Supplier>>} 협력업체 목록을 담은 Promise
 */
export const fetchSupplierRegistrations = createAsyncThunk(
    'supplier/fetchSupplierRegistrations',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}/supplier-registrations`, {
                method: 'GET',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch suppliers: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 협력업체를 등록하는 비동기 액션
 *
 * @function createSupplierRegistration
 * @param {Supplier} supplierData - 등록할 협력업체 데이터
 * @returns {Promise<Supplier>} 등록된 협력업체 정보를 담은 Promise
 */
export const createSupplierRegistration = createAsyncThunk(
    'supplier/createSupplierRegistration',
    async (supplierData, { rejectWithValue }) => {
        try {
            const response = await fetchWithAuth(`${API_URL}/supplier-registrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(supplierData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to register supplier: ${response.status} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error registering supplier:', error);
            return rejectWithValue(error.message);
        }
    }
);

/**
 * 초기 상태 정의
 *
 * @typedef {object} SupplierState
 * @property {Array<Supplier>} suppliers - 협력업체 목록
 * @property {boolean} loading - 로딩 상태
 * @property {string | null} error - 에러 메시지
 */
const initialState = {
    suppliers: [],
    loading: false,
    error: null
};

/**
 * 슬라이스 생성
 */
const supplierRegistrationSlice = createSlice({
    name: 'supplier',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // fetchSupplierRegistrations 액션 처리
            .addCase(fetchSupplierRegistrations.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSupplierRegistrations.fulfilled, (state, action) => {
                state.loading = false;
                state.suppliers = action.payload;
            })
            .addCase(fetchSupplierRegistrations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // createSupplierRegistration 액션 처리
            .addCase(createSupplierRegistration.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSupplierRegistration.fulfilled, (state, action) => {
                state.loading = false;
                state.suppliers.push(action.payload);
            })
            .addCase(createSupplierRegistration.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default supplierRegistrationSlice.reducer;
