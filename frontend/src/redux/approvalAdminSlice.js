// src/redux/approvalAdminSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@/utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

/**
 * 결재선 템플릿 목록 조회
 */
export const fetchApprovalTemplates = createAsyncThunk(
  'approvalAdmin/fetchApprovalTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}approval-templates`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 템플릿 조회 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // 백엔드에서 이미 올바르게 변환된 데이터가 전달되므로 그대로 반환
      return data;
    } catch (error) {
      console.error('결재선 템플릿 조회 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 결재선 템플릿 생성
 */
export const createApprovalTemplate = createAsyncThunk(
  'approvalAdmin/createApprovalTemplate',
  async (templateData, { rejectWithValue }) => {
    try {
      // 데이터 준비 - department가 DepartmentDTO 객체임을 보장
      const preparedData = {
        ...templateData,
        steps: templateData.steps.map(step => ({
          ...step,
          department: step.department ? {
            id: step.department.id,
            name: step.department.name,
            code: step.department.code,
            description: step.department.description
          } : null
        }))
      };

      const response = await fetchWithAuth(`${API_URL}approval-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preparedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 템플릿 생성 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('결재선 템플릿 생성 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 결재선 템플릿 수정
 */
export const updateApprovalTemplate = createAsyncThunk(
  'approvalAdmin/updateApprovalTemplate',
  async ({ id, templateData }, { rejectWithValue }) => {
    try {
      // 데이터 준비 - department가 DepartmentDTO 객체임을 보장
      const preparedData = {
        ...templateData,
        steps: templateData.steps.map(step => ({
          ...step,
          department: step.department ? {
            id: step.department.id,
            name: step.department.name,
            code: step.department.code,
            description: step.department.description
          } : null
        }))
      };

      const response = await fetchWithAuth(`${API_URL}approval-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preparedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 템플릿 수정 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('결재선 템플릿 수정 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 결재선 템플릿 삭제
 */
export const deleteApprovalTemplate = createAsyncThunk(
  'approvalAdmin/deleteApprovalTemplate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}approval-templates/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`결재선 템플릿 삭제 실패: ${response.status} - ${errorText}`);
      }

      return id;
    } catch (error) {
      console.error('결재선 템플릿 삭제 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 부서 목록 조회
 */
export const fetchDepartments = createAsyncThunk(
  'approvalAdmin/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}departments`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부서 목록 조회 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부서 목록 조회 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 부서 생성
 */
export const createDepartment = createAsyncThunk(
  'approvalAdmin/createDepartment',
  async (departmentData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부서 생성 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부서 생성 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 부서 수정
 */
export const updateDepartment = createAsyncThunk(
  'approvalAdmin/updateDepartment',
  async ({ id, departmentData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departmentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부서 수정 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('부서 수정 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 부서 삭제
 */
export const deleteDepartment = createAsyncThunk(
  'approvalAdmin/deleteDepartment',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}departments/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`부서 삭제 실패: ${response.status} - ${errorText}`);
      }

      return id;
    } catch (error) {
      console.error('부서 삭제 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 직급 목록 조회
 */
export const fetchPositions = createAsyncThunk(
  'approvalAdmin/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}positions`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`직급 목록 조회 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('직급 목록 조회 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 직급 생성
 */
export const createPosition = createAsyncThunk(
  'approvalAdmin/createPosition',
  async (positionData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}positions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(positionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`직급 생성 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('직급 생성 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 직급 수정
 */
export const updatePosition = createAsyncThunk(
  'approvalAdmin/updatePosition',
  async ({ id, positionData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}positions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(positionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`직급 수정 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('직급 수정 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 직급 삭제
 */
export const deletePosition = createAsyncThunk(
  'approvalAdmin/deletePosition',
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}positions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`직급 삭제 실패: ${response.status} - ${errorText}`);
      }

      return id;
    } catch (error) {
      console.error('직급 삭제 중 오류 발생:', error);
      return rejectWithValue(error.message);
    }
  }
);

// 초기 상태
const initialState = {
  templates: {
    data: [],
    loading: false,
    error: null
  },
  departments: {
    data: [],
    loading: false,
    error: null
  },
  positions: {
    data: [],
    loading: false,
    error: null
  }
};

// Slice 생성
const approvalAdminSlice = createSlice({
  name: 'approvalAdmin',
  initialState,
  reducers: {
    clearTemplatesError: (state) => {
      state.templates.error = null;
    },
    clearDepartmentsError: (state) => {
      state.departments.error = null;
    },
    clearPositionsError: (state) => {
      state.positions.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 결재선 템플릿 조회
      .addCase(fetchApprovalTemplates.pending, (state) => {
        state.templates.loading = true;
        state.templates.error = null;
      })
      .addCase(fetchApprovalTemplates.fulfilled, (state, action) => {
        state.templates.loading = false;
        state.templates.data = action.payload;
      })
      .addCase(fetchApprovalTemplates.rejected, (state, action) => {
        state.templates.loading = false;
        state.templates.error = action.payload;
      })

      // 결재선 템플릿 생성
      .addCase(createApprovalTemplate.pending, (state) => {
        state.templates.loading = true;
        state.templates.error = null;
      })
      .addCase(createApprovalTemplate.fulfilled, (state, action) => {
        state.templates.loading = false;
        state.templates.data.push(action.payload);
      })
      .addCase(createApprovalTemplate.rejected, (state, action) => {
        state.templates.loading = false;
        state.templates.error = action.payload;
      })

      // 결재선 템플릿 수정
      .addCase(updateApprovalTemplate.pending, (state) => {
        state.templates.loading = true;
        state.templates.error = null;
      })
      .addCase(updateApprovalTemplate.fulfilled, (state, action) => {
        state.templates.loading = false;
        const index = state.templates.data.findIndex(template => template.id === action.payload.id);
        if (index !== -1) {
          state.templates.data[index] = action.payload;
        }
      })
      .addCase(updateApprovalTemplate.rejected, (state, action) => {
        state.templates.loading = false;
        state.templates.error = action.payload;
      })

      // 결재선 템플릿 삭제
      .addCase(deleteApprovalTemplate.pending, (state) => {
        state.templates.loading = true;
        state.templates.error = null;
      })
      .addCase(deleteApprovalTemplate.fulfilled, (state, action) => {
        state.templates.loading = false;
        state.templates.data = state.templates.data.filter(template => template.id !== action.payload);
      })
      .addCase(deleteApprovalTemplate.rejected, (state, action) => {
        state.templates.loading = false;
        state.templates.error = action.payload;
      })

      // 부서 목록 조회
      .addCase(fetchDepartments.pending, (state) => {
        state.departments.loading = true;
        state.departments.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments.loading = false;
        state.departments.data = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.departments.loading = false;
        state.departments.error = action.payload;
      })

      // 부서 생성
      .addCase(createDepartment.pending, (state) => {
        state.departments.loading = true;
        state.departments.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.loading = false;
        state.departments.data.push(action.payload);
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.departments.loading = false;
        state.departments.error = action.payload;
      })

      // 부서 수정
      .addCase(updateDepartment.pending, (state) => {
        state.departments.loading = true;
        state.departments.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.departments.loading = false;
        const index = state.departments.data.findIndex(department => department.id === action.payload.id);
        if (index !== -1) {
          state.departments.data[index] = action.payload;
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.departments.loading = false;
        state.departments.error = action.payload;
      })

      // 부서 삭제
      .addCase(deleteDepartment.pending, (state) => {
        state.departments.loading = true;
        state.departments.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments.loading = false;
        state.departments.data = state.departments.data.filter(department => department.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.departments.loading = false;
        state.departments.error = action.payload;
      })

      // 직급 목록 조회
      .addCase(fetchPositions.pending, (state) => {
        state.positions.loading = true;
        state.positions.error = null;
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions.loading = false;
        state.positions.data = action.payload;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.positions.loading = false;
        state.positions.error = action.payload;
      })

      // 직급 생성
      .addCase(createPosition.pending, (state) => {
        state.positions.loading = true;
        state.positions.error = null;
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.positions.loading = false;
        state.positions.data.push(action.payload);
      })
      .addCase(createPosition.rejected, (state, action) => {
        state.positions.loading = false;
        state.positions.error = action.payload;
      })

      // 직급 수정
      .addCase(updatePosition.pending, (state) => {
        state.positions.loading = true;
        state.positions.error = null;
      })
      .addCase(updatePosition.fulfilled, (state, action) => {
        state.positions.loading = false;
        const index = state.positions.data.findIndex(position => position.id === action.payload.id);
        if (index !== -1) {
          state.positions.data[index] = action.payload;
        }
      })
      .addCase(updatePosition.rejected, (state, action) => {
        state.positions.loading = false;
        state.positions.error = action.payload;
      })

      // 직급 삭제
      .addCase(deletePosition.pending, (state) => {
        state.positions.loading = true;
        state.positions.error = null;
      })
      .addCase(deletePosition.fulfilled, (state, action) => {
        state.positions.loading = false;
        state.positions.data = state.positions.data.filter(position => position.id !== action.payload);
      })
      .addCase(deletePosition.rejected, (state, action) => {
        state.positions.loading = false;
        state.positions.error = action.payload;
      });
  }
});

// 액션 내보내기
export const {
  clearTemplatesError,
  clearDepartmentsError,
  clearPositionsError
} = approvalAdminSlice.actions;

// 리듀서 내보내기
export default approvalAdminSlice.reducer;