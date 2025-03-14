// src/redux/commonCodeSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "@/utils/constants";
import { fetchWithAuth } from "@/utils/fetchWithAuth";

/**
 * 모든 공통 코드 목록을 가져오는 비동기 액션
 * - 모든 공통 코드를 타입별로 그룹화하여 가져옵니다.
 */
export const fetchAllCommonCodes = createAsyncThunk(
  "commonCode/fetchAllCommonCodes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`공통 코드를 가져오는데 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('공통 코드 조회 중 오류:', error);
      return rejectWithValue(error.message || "공통 코드를 가져오는데 실패했습니다.");
    }
  }
);

/**
 * 특정 타입과 그룹의 자식 코드 목록을 가져오는 비동기 액션
 * @param {Object} params - 요청 매개변수
 * @param {string} params.entityType - 엔티티 타입 (예: PROJECT, PURCHASE_REQUEST 등)
 * @param {string} params.codeGroup - 코드 그룹 (예: STATUS, TYPE 등)
 */
export const fetchChildCodes = createAsyncThunk(
  "commonCode/fetchChildCodes",
  async ({ entityType, codeGroup }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/${entityType}/${codeGroup}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`자식 코드를 가져오는데 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return {
        entityType,
        codeGroup,
        childCodes: data
      };
    } catch (error) {
      console.error('자식 코드 조회 중 오류:', error);
      return rejectWithValue(error.message || "자식 코드를 가져오는데 실패했습니다.");
    }
  }
);

/**
 * 새 부모 코드를 생성하는 비동기 액션
 */
export const createParentCode = createAsyncThunk(
  "commonCode/createParentCode",
  async (parentCodeData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/parents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parentCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부모 코드 생성에 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부모 코드 생성 중 오류:', error);
      return rejectWithValue(error.message || "부모 코드 생성에 실패했습니다.");
    }
  }
);

/**
 * 부모 코드를 수정하는 비동기 액션
 */
export const updateParentCode = createAsyncThunk(
  "commonCode/updateParentCode",
  async ({ id, parentCodeData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/parents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parentCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부모 코드 수정에 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부모 코드 수정 중 오류:', error);
      return rejectWithValue(error.message || "부모 코드 수정에 실패했습니다.");
    }
  }
);

/**
 * 새 자식 코드를 생성하는 비동기 액션
 */
export const createChildCode = createAsyncThunk(
  "commonCode/createChildCode",
  async (childCodeData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`자식 코드 생성에 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('자식 코드 생성 중 오류:', error);
      return rejectWithValue(error.message || "자식 코드 생성에 실패했습니다.");
    }
  }
);

/**
 * 자식 코드를 수정하는 비동기 액션
 */
export const updateChildCode = createAsyncThunk(
  "commonCode/updateChildCode",
  async ({ id, childCodeData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/children/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(childCodeData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`자식 코드 수정에 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('자식 코드 수정 중 오류:', error);
      return rejectWithValue(error.message || "자식 코드 수정에 실패했습니다.");
    }
  }
);

/**
 * 부모 코드 목록을 가져오는 비동기 액션
 */
export const fetchParentCodes = createAsyncThunk(
  "commonCode/fetchParentCodes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/parents`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부모 코드 목록을 가져오는데 실패했습니다: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부모 코드 목록 조회 중 오류:', error);
      return rejectWithValue(error.message || "부모 코드 목록을 가져오는데 실패했습니다.");
    }
  }
);

/**
 * 부모 코드 삭제 비동기 액션
 */
export const deleteParentCode = createAsyncThunk(
  "commonCode/deleteParentCode",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/parents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부모 코드 삭제에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return id;
    } catch (error) {
      console.error('부모 코드 삭제 중 오류:', error);
      return rejectWithValue(error.message || "부모 코드 삭제에 실패했습니다.");
    }
  }
);

/**
 * 자식 코드 삭제 비동기 액션
 */
export const deleteChildCode = createAsyncThunk(
  "commonCode/deleteChildCode",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}common-codes/children/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`자식 코드 삭제에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return id;
    } catch (error) {
      console.error('자식 코드 삭제 중 오류:', error);
      return rejectWithValue(error.message || "자식 코드 삭제에 실패했습니다.");
    }
  }
);

// 초기 상태 정의
const initialState = {
  allCodes: [],                    // 모든 공통 코드 목록 (타입별로 그룹화)
  parentCodes: [],                 // 부모 코드 목록
  childCodesByTypeAndGroup: {},    // 특정 타입과 그룹의 자식 코드
  isLoading: false,                // 로딩 상태
  error: null                      // 오류 메시지
};

/**
 * 공통 코드 슬라이스
 */
const commonCodeSlice = createSlice({
  name: "commonCode",
  initialState,
  reducers: {
    // 상태 초기화
    resetCommonCodeState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // 모든 공통 코드 가져오기
      .addCase(fetchAllCommonCodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllCommonCodes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allCodes = action.payload;
      })
      .addCase(fetchAllCommonCodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'object' ?
          JSON.stringify(action.payload) :
          action.payload || "공통 코드를 가져오는데 실패했습니다.";
      })

      // 특정 타입과 그룹의 자식 코드 가져오기
      .addCase(fetchChildCodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChildCodes.fulfilled, (state, action) => {
        const { entityType, codeGroup, childCodes } = action.payload;
        state.isLoading = false;

        // 자식 코드 저장 (key 형식: "PROJECT-STATUS" 등)
        state.childCodesByTypeAndGroup[`${entityType}-${codeGroup}`] = childCodes;
      })
      .addCase(fetchChildCodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'object' ?
          JSON.stringify(action.payload) :
          action.payload || "자식 코드를 가져오는데 실패했습니다.";
      })

      // 부모 코드 목록 가져오기
      .addCase(fetchParentCodes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchParentCodes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.parentCodes = action.payload;
      })
      .addCase(fetchParentCodes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 부모 코드 생성
      .addCase(createParentCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createParentCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 새로운 부모 코드를 Redux 상태에 추가
        // 전체 목록을 다시 불러오지 않고도 UI를 업데이트하기 위함
      })
      .addCase(createParentCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 부모 코드 수정
      .addCase(updateParentCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateParentCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 부모 코드 목록 업데이트
      })
      .addCase(updateParentCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 자식 코드 생성
      .addCase(createChildCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createChildCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 자식 코드 목록 업데이트
      })
      .addCase(createChildCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 자식 코드 수정
      .addCase(updateChildCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateChildCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 자식 코드 목록 업데이트
      })
      .addCase(updateChildCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 부모 코드 삭제
      .addCase(deleteParentCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteParentCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 부모 코드 삭제 후 상태 업데이트
        // 실제 목록 갱신은 새로운 데이터를 가져오는 fetchAllCommonCodes로 처리
      })
      .addCase(deleteParentCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // 자식 코드 삭제
      .addCase(deleteChildCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteChildCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // 자식 코드 삭제 후 상태 업데이트
        // 실제 목록 갱신은 새로운 데이터를 가져오는 fetchAllCommonCodes로 처리
      })
      .addCase(deleteChildCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// 액션 생성자 내보내기
export const { resetCommonCodeState } = commonCodeSlice.actions;

// 셀렉터 내보내기
export const selectAllCommonCodes = (state) => state.commonCode.allCodes;
export const selectParentCodes = (state) => state.commonCode.parentCodes;
export const selectChildCodes = (state, entityType, codeGroup) =>
  state.commonCode.childCodesByTypeAndGroup[`${entityType}-${codeGroup}`] || [];
export const selectCommonCodeLoading = (state) => state.commonCode.isLoading;
export const selectCommonCodeError = (state) => state.commonCode.error;

// 리듀서 내보내기
export default commonCodeSlice.reducer;