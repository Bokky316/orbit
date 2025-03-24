// src/redux/itemCategorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_URL } from '@utils/constants';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

// 카테고리 생성
export const createCategory = createAsyncThunk(
  'itemCategory/createCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 생성에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리 생성 중 오류:', error);
      return rejectWithValue(error.message || '카테고리 생성 중 오류가 발생했습니다.');
    }
  }
);

// 모든 활성 카테고리 조회
export const fetchAllCategories = createAsyncThunk(
  'itemCategory/fetchAllCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 조회에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리 조회 중 오류:', error);
      return rejectWithValue(error.message || '카테고리 조회 중 오류가 발생했습니다.');
    }
  }
);

// 특정 카테고리 상세 조회 (아이템 포함)
export const fetchCategoryDetails = createAsyncThunk(
  'itemCategory/fetchCategoryDetails',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories/${categoryId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 상세 조회에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리 상세 조회 중 오류:', error);
      return rejectWithValue(error.message || '카테고리 상세 조회 중 오류가 발생했습니다.');
    }
  }
);

// 카테고리 수정
export const updateCategory = createAsyncThunk(
  'itemCategory/updateCategory',
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 수정에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리 수정 중 오류:', error);
      return rejectWithValue(error.message || '카테고리 수정 중 오류가 발생했습니다.');
    }
  }
);

// 카테고리 비활성화
export const deactivateCategory = createAsyncThunk(
  'itemCategory/deactivateCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리 비활성화에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return categoryId;
    } catch (error) {
      console.error('카테고리 비활성화 중 오류:', error);
      return rejectWithValue(error.message || '카테고리 비활성화 중 오류가 발생했습니다.');
    }
  }
);

// 아이템 생성
export const createItem = createAsyncThunk(
  'itemCategory/createItem',
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`아이템 생성에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('아이템 생성 중 오류:', error);
      return rejectWithValue(error.message || '아이템 생성 중 오류가 발생했습니다.');
    }
  }
);

// 모든 활성 아이템 조회
export const fetchAllItems = createAsyncThunk(
  'itemCategory/fetchAllItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}items`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`아이템 조회에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('아이템 조회 중 오류:', error);
      return rejectWithValue(error.message || '아이템 조회 중 오류가 발생했습니다.');
    }
  }
);

// 특정 카테고리의 아이템 조회
export const fetchItemsByCategory = createAsyncThunk(
  'itemCategory/fetchItemsByCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories/${categoryId}/items`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리별 아이템 조회에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리별 아이템 조회 중 오류:', error);
      return rejectWithValue(error.message || '카테고리별 아이템 조회 중 오류가 발생했습니다.');
    }
  }
);

// 아이템 수정
export const updateItem = createAsyncThunk(
  'itemCategory/updateItem',
  async ({ itemId, itemData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`아이템 수정에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('아이템 수정 중 오류:', error);
      return rejectWithValue(error.message || '아이템 수정 중 오류가 발생했습니다.');
    }
  }
);

// 아이템 비활성화
export const deactivateItem = createAsyncThunk(
  'itemCategory/deactivateItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`아이템 비활성화에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return itemId;
    } catch (error) {
      console.error('아이템 비활성화 중 오류:', error);
      return rejectWithValue(error.message || '아이템 비활성화 중 오류가 발생했습니다.');
    }
  }
);

// 카테고리에 아이템 추가
export const addItemToCategory = createAsyncThunk(
  'itemCategory/addItemToCategory',
  async ({ categoryId, itemId }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}categories/${categoryId}/items/${itemId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`카테고리에 아이템 추가에 실패했습니다: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('카테고리에 아이템 추가 중 오류:', error);
      return rejectWithValue(error.message || '카테고리에 아이템 추가 중 오류가 발생했습니다.');
    }
  }
);

// 초기 상태
const initialState = {
  categories: [],
  items: [],
  currentCategory: null,
  loading: false,
  error: null
};

// 슬라이스 생성
const itemCategorySlice = createSlice({
  name: 'itemCategory',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // 카테고리 생성
    builder.addCase(createCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categories.push(action.payload);
    });
    builder.addCase(createCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // 모든 카테고리 조회
    builder.addCase(fetchAllCategories.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAllCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload;
    });
    builder.addCase(fetchAllCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // 아이템 생성
    builder.addCase(createItem.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createItem.fulfilled, (state, action) => {
      state.loading = false;
      state.items.push(action.payload);
    });
    builder.addCase(createItem.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // 모든 아이템 조회
    builder.addCase(fetchAllItems.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAllItems.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchAllItems.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  }
});

export const { clearError } = itemCategorySlice.actions;
export default itemCategorySlice.reducer;

// 선택자 함수
export const selectCategories = (state) => state.itemCategory.categories;
export const selectItems = (state) => state.itemCategory.items;
export const selectItemCategoryLoading = (state) => state.itemCategory.loading;
export const selectItemCategoryError = (state) => state.itemCategory.error;