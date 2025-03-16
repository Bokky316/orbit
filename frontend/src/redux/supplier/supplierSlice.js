import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
import { API_URL } from "../../utils/constants";

// 전화번호 포맷팅 함수 추가
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.includes("-")) {
    return phoneNumber;
  }

  // 전화번호 형식에 따라 하이픈 적용
  if (phoneNumber.length === 8) {
    return phoneNumber.replace(/(\d{4})(\d{4})/, "$1-$2");
  } else if (phoneNumber.length === 9) {
    return phoneNumber.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  } else if (phoneNumber.length === 10) {
    if (phoneNumber.startsWith("02")) {
      return phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
    } else {
      return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
  } else if (phoneNumber.length === 11) {
    return phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }

  return phoneNumber;
};

// 협력업체 목록 조회
export const fetchSuppliers = createAsyncThunk(
  "supplier/fetchSuppliers",
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { auth } = getState();
      const userRole = auth.user?.roles?.[0] || ""; // 첫 번째 역할 가져오기
      const userId = auth.user?.id;

      let url = `${API_URL}supplier-registrations`;
      const queryParams = [];
      if (filters.status) {
        queryParams.push(`status=${filters.status}`);
      }
      if (filters.sourcingCategory) {
        queryParams.push(`sourcingCategory=${filters.sourcingCategory}`);
      }
      if (filters.sourcingSubCategory) {
        queryParams.push(`sourcingSubCategory=${filters.sourcingSubCategory}`);
      }
      if (filters.sourcingDetailCategory) {
        queryParams.push(
          `sourcingDetailCategory=${filters.sourcingDetailCategory}`
        );
      }
      if (filters.supplierName) {
        queryParams.push(`supplierName=${filters.supplierName}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      console.log("API 호출 URL:", url);
      const response = await fetchWithAuth(url);

      // HTML 응답 방지 처리 (purchaseRequestSlice에서 가져옴)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "데이터 로드 실패");
      }

      const data = await response.json();
      console.log("API 응답 데이터:", data);
      return data;
    } catch (error) {
      // HTML 응답 시 별도 처리 (purchaseRequestSlice에서 가져옴)
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }

      console.log('API 호출 실패:', error);
      return rejectWithValue(error.message || '데이터 로드 중 오류 발생');
    }
  }
);

// 협력업체 상세 조회
export const fetchSupplierById = createAsyncThunk(
  "supplier/fetchSupplierById",
  async (id, { rejectWithValue, getState }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/${id}/detail`
      );

      // HTML 응답 방지 처리
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "데이터 로드 실패");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }

      console.log('API 호출 실패:', error);
      return rejectWithValue(error.message || '데이터 로드 중 오류 발생');
    }
  }
);

// 협력업체 등록 요청 - FormData 처리 방식으로 수정
export const registerSupplier = createAsyncThunk(
  "supplier/registerSupplier",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}supplier-registrations`, {
        method: "POST",
        body: formData // FormData 객체 그대로 전송 (Content-Type 헤더 자동 설정)
      });

      // HTML 응답 방지 처리
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "등록 실패");
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }

      console.error("API 요청 실패:", error);
      return rejectWithValue(error.message || "등록 요청 중 오류 발생");
    }
  }
);

// 협력업체 수정 요청 - 새로 추가한 액션
export const updateSupplier = createAsyncThunk(
  "supplier/updateSupplier",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/${id}`,
        {
          method: "PUT",
          body: formData // FormData 객체 그대로 전송 (Content-Type 헤더 자동 설정)
        }
      );

      // HTML 응답 방지 처리
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "수정 실패");
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }

      console.error("API 요청 실패:", error);
      return rejectWithValue(error.message || "수정 요청 중 오류 발생");
    }
  }
);

// 협력업체 승인/거절/비활성화
export const updateSupplierStatus = createAsyncThunk(
  "supplier/updateSupplierStatus",
  async ({ id, statusCode, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ statusCode, rejectionReason })
        }
      );

      if (!response.ok) {
        // 응답이 JSON이 아닐 경우 대비
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            return rejectWithValue(errorData.message || "상태 업데이트 실패");
          } else {
            return rejectWithValue("서버 응답 형식 오류");
          }
        } catch (error) {
          return rejectWithValue("상태 업데이트 실패");
        }
      }

      return { id, statusCode, rejectionReason };
    } catch (error) {
      console.log("API 호출 실패:", error);
      return rejectWithValue(
        error.message || "상태 업데이트 요청 중 오류 발생"
      );
    }
  }
);

// 첨부 파일 추가 액션
export const addAttachmentsToSupplier = createAsyncThunk(
  "supplier/addAttachmentsToSupplier",
  async ({ id, files }, { rejectWithValue }) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 파일 추가
      if (files && files.length > 0) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      }

      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/${id}/attachments`,
        {
          method: "POST",
          body: formData
        }
      );

      // HTML 응답 방지 처리
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || "파일 업로드 실패");
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes("Invalid content type")) {
        return rejectWithValue("서버 응답 형식 오류");
      }

      console.error("API 요청 실패:", error);
      return rejectWithValue(error.message || "파일 업로드 요청 중 오류 발생");
    }
  }
);

/**
 * 초기 상태 정의
 */
const initialState = {
  suppliers: [], // 초기 빈 배열로 설정
  currentSupplier: null,
  loading: false,
  error: null,
  success: false,
  message: "",
  sourcingCategories: [], // 빈 배열로 변경
  sourcingSubCategories: {}, // 빈 객체로 변경
  sourcingDetailCategories: {} // 빈 객체로 변경
};

const supplierSlice = createSlice({
 name: 'supplier',
 initialState,
 reducers: {
   resetSupplierState: (state) => {
     state.success = false;
     state.error = null;
     state.message = '';
   },
   clearCurrentSupplier: (state) => {
     state.currentSupplier = null;
   },
   initializeCategoriesFromSuppliers: (state, action) => {
     const suppliers = action.payload;
     // 고유한 대분류 추출
     const uniqueCategories = [...new Set(suppliers.map(s => s.sourcingCategory))].filter(Boolean)
       .map(category => ({ value: category, label: category }));
     state.sourcingCategories = uniqueCategories;

     // 고유한 중분류 추출
     const uniqueSubCategories = {};
     uniqueCategories.forEach(category => {
       const subCats = [...new Set(
         suppliers
           .filter(s => s.sourcingCategory === category.value)
           .map(s => s.sourcingSubCategory)
       )].filter(Boolean)
       .map(subCat => ({ value: subCat, label: subCat }));

       uniqueSubCategories[category.value] = subCats;
     });
     state.sourcingSubCategories = uniqueSubCategories;

     // 고유한 소분류 추출
     const uniqueDetailCategories = {};
     Object.keys(uniqueSubCategories).forEach(category => {
       uniqueSubCategories[category].forEach(subCat => {
         const detailCats = [...new Set(
           suppliers
             .filter(s => s.sourcingCategory === category && s.sourcingSubCategory === subCat.value)
             .map(s => s.sourcingDetailCategory)
         )].filter(Boolean)
         .map(detailCat => ({ value: detailCat, label: detailCat }));

         uniqueDetailCategories[subCat.value] = detailCats;
       });
     });
     state.sourcingDetailCategories = uniqueDetailCategories;
   },
   // 웹소켓을 통한 상태 업데이트를 위한 액션 추가
   updateSupplierStatus: (state, action) => {
     const { id, fromStatus, toStatus } = action.payload;

     // 웹소켓으로부터 받은 데이터의 형식에 따라 처리
     let statusCode;
     if (toStatus && toStatus.includes('-')) {
       // 'SUPPLIER-STATUS-APPROVED' 형식인 경우 마지막 부분만 추출
       statusCode = toStatus.split('-').pop();
     } else {
       // 이미 'APPROVED' 형식인 경우 그대로 사용
       statusCode = toStatus;
     }

     // 협력업체 목록 상태 업데이트
     const supplierIndex = state.suppliers.findIndex(supplier => supplier.id === id);
     if (supplierIndex !== -1) {
       const supplier = state.suppliers[supplierIndex];

       // status가 객체인 경우
       if (supplier.status && typeof supplier.status === 'object') {
         supplier.status.childCode = statusCode;
       } else {
         // status가 문자열인 경우 직접 설정
         supplier.status = statusCode;
       }
     }

     // 현재 상세 보기 중인 협력업체도 업데이트
     if (state.currentSupplier && state.currentSupplier.id === id) {
       if (state.currentSupplier.status && typeof state.currentSupplier.status === 'object') {
         state.currentSupplier.status.childCode = statusCode;
       } else {
         state.currentSupplier.status = statusCode;
       }
     }
   }
 },
 extraReducers: (builder) => {
    builder
      // fetchSuppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "협력업체 목록을 불러오는데 실패했습니다.";
      })

      // fetchSupplierById
      .addCase(fetchSupplierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "협력업체 정보를 불러오는데 실패했습니다.";
      })

      // registerSupplier
      .addCase(registerSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = "협력업체 등록 요청이 완료되었습니다.";
        if (action.payload) {
          state.suppliers.push(action.payload);
        }
      })
      .addCase(registerSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "협력업체 등록 요청에 실패했습니다.";
        state.success = false;
      })

      // updateSupplier - 새로 추가된 액션 리듀서
      .addCase(updateSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = "협력업체 정보가 성공적으로 수정되었습니다.";

        // 현재 공급업체 정보 업데이트
        if (action.payload) {
          state.currentSupplier = action.payload;

          // 목록에서도 해당 항목 업데이트
          const index = state.suppliers.findIndex(
            (supplier) => supplier.id === action.payload.id
          );
          if (index !== -1) {
            state.suppliers[index] = action.payload;
          }
        }
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "협력업체 정보 수정에 실패했습니다.";
        state.success = false;
      })

      // updateSupplierStatus
      .addCase(updateSupplierStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupplierStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        const updatedSupplier = state.suppliers.find(
          (supplier) => supplier.id === action.payload.id
        );
        if (updatedSupplier) {
          if (!updatedSupplier.status) {
            updatedSupplier.status = {
              parentCode: "SUPPLIER",
              childCode: action.payload.statusCode
            };
          } else {
            updatedSupplier.status.childCode = action.payload.statusCode;
          }
          if (action.payload.rejectionReason) {
            updatedSupplier.rejectionReason = action.payload.rejectionReason;
          }

          if (
            state.currentSupplier &&
            state.currentSupplier.id === action.payload.id
          ) {
            if (!state.currentSupplier.status) {
              state.currentSupplier.status = {
                parentCode: "SUPPLIER",
                childCode: action.payload.statusCode
              };
            } else {
              state.currentSupplier.status.childCode =
                action.payload.statusCode;
            }
            if (action.payload.rejectionReason) {
              state.currentSupplier.rejectionReason =
                action.payload.rejectionReason;
            }
          }
        }

        switch (action.payload.statusCode) {
          case "APPROVED":
            state.message = "협력업체가 승인되었습니다.";
            break;
          case 'REJECTED':
            state.message = '협력업체가 반려되었습니다.';
            break;
          case "SUSPENDED":
            state.message = "협력업체가 일시정지되었습니다.";
            break;
          case "BLACKLIST":
            state.message = "협력업체가 블랙리스트에 등록되었습니다.";
            break;
          case "INACTIVE":
            state.message = "협력업체가 비활성화되었습니다.";
            break;
          case "ACTIVE":
            state.message = "협력업체가 다시 활성화되었습니다.";
            break;
          default:
            state.message = "협력업체 상태가 변경되었습니다.";
        }
      })
      .addCase(updateSupplierStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "상태 업데이트에 실패했습니다.";
      })

      // addAttachmentsToSupplier
      .addCase(addAttachmentsToSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAttachmentsToSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = "첨부 파일이 성공적으로 업로드되었습니다.";

        // 현재 선택된 공급업체 업데이트
        if (
          action.payload &&
          state.currentSupplier &&
          state.currentSupplier.id === action.payload.id
        ) {
          state.currentSupplier = action.payload;
        }

        // 목록 업데이트
        const index = state.suppliers.findIndex(
          (supplier) => supplier.id === action.payload?.id
        );
        if (index !== -1 && action.payload) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(addAttachmentsToSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "파일 업로드에 실패했습니다.";
      });
  }
});

export const {
  resetSupplierState,
  clearCurrentSupplier,
  initializeCategoriesFromSuppliers
} = supplierSlice.actions;
export default supplierSlice.reducer;
