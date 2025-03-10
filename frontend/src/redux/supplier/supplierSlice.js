import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 더미 데이터
const dummySuppliers = [
  {
    id: 1,
    supplierName: "(주)가나다전자",
    businessNo: "123-45-67890",
    ceoName: "김대표",
    businessType: "제조업",
    businessCategory: "전자부품",
    sourcingCategory: "전자",
    sourcingSubCategory: "반도체",
    sourcingDetailCategory: "메모리",
    phoneNumber: "02-1234-5678",
    headOfficeAddress: "서울특별시 강남구 테헤란로 123",
    comments: "반도체 부품 전문 제조업체입니다.",
    businessFile: "dummy-file-1.pdf",
    status: "APPROVED",
    registrationDate: "2023-01-15",
    contactPerson: "김담당",
    contactEmail: "contact@ganada.com",
    contactPhone: "010-1234-5678"
  },
  {
    id: 2,
    supplierName: "라마바물산(주)",
    businessNo: "234-56-78901",
    ceoName: "이사장",
    businessType: "도소매업",
    businessCategory: "원자재",
    sourcingCategory: "원료",
    sourcingSubCategory: "금속",
    sourcingDetailCategory: "철강",
    phoneNumber: "02-2345-6789",
    headOfficeAddress: "서울특별시 영등포구 여의도로 456",
    comments: "금속 원자재 전문 공급업체입니다.",
    businessFile: "dummy-file-2.pdf",
    status: "PENDING",
    registrationDate: "2023-03-22",
    contactPerson: "이담당",
    contactEmail: "contact@lamaba.com",
    contactPhone: "010-2345-6789"
  },
  {
    id: 3,
    supplierName: "사아자테크",
    businessNo: "345-67-89012",
    ceoName: "박사장",
    businessType: "서비스업",
    businessCategory: "IT",
    sourcingCategory: "소프트웨어",
    sourcingSubCategory: "개발",
    sourcingDetailCategory: "웹서비스",
    phoneNumber: "02-3456-7890",
    headOfficeAddress: "서울특별시 서초구 강남대로 789",
    comments: "소프트웨어 개발 전문 기업입니다.",
    businessFile: "dummy-file-3.pdf",
    status: "REJECTED",
    rejectionReason: "등록 서류 미비. 사업자등록증 확인이 필요합니다.",
    registrationDate: "2023-02-10",
    contactPerson: "박담당",
    contactEmail: "contact@saaja.com",
    contactPhone: "010-3456-7890"
  },
  {
    id: 4,
    supplierName: "(주)차카타",
    businessNo: "456-78-90123",
    ceoName: "최회장",
    businessType: "제조업",
    businessCategory: "기계",
    sourcingCategory: "부품",
    sourcingSubCategory: "자동차부품",
    sourcingDetailCategory: "엔진부품",
    phoneNumber: "02-4567-8901",
    headOfficeAddress: "경기도 화성시 산업로 101",
    comments: "자동차 부품 제조 전문 기업입니다.",
    businessFile: "dummy-file-4.pdf",
    status: "APPROVED",
    registrationDate: "2023-04-05",
    contactPerson: "최담당",
    contactEmail: "contact@chakata.com",
    contactPhone: "010-4567-8901"
  },
  {
    id: 5,
    supplierName: "파하솔루션",
    businessNo: "567-89-01234",
    ceoName: "정이사",
    businessType: "서비스업",
    businessCategory: "컨설팅",
    sourcingCategory: "경영",
    sourcingSubCategory: "조직관리",
    sourcingDetailCategory: "인사관리",
    phoneNumber: "02-5678-9012",
    headOfficeAddress: "서울특별시 강남구 삼성로 555",
    comments: "경영 컨설팅 및 조직관리 전문 기업입니다.",
    businessFile: "dummy-file-5.pdf",
    status: "PENDING",
    registrationDate: "2023-05-18",
    contactPerson: "정담당",
    contactEmail: "contact@paha.com",
    contactPhone: "010-5678-9012"
  }
];

// 협력업체 목록 조회
export const fetchSuppliers = createAsyncThunk(
  'supplier/fetchSuppliers',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // 필터링 매개변수를 URL에 추가
      let url = '/api/supplier-registrations';
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
        queryParams.push(`sourcingDetailCategory=${filters.sourcingDetailCategory}`);
      }

      if (filters.supplierName) {
        queryParams.push(`supplierName=${filters.supplierName}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      // API 호출 실패 시 더미 데이터 필터링하여 반환 (개발용)
      console.log('API 호출 실패, 더미 데이터 사용:', error);

      let filteredSuppliers = [...dummySuppliers];

      if (filters.status) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.status === filters.status
        );
      }

      if (filters.sourcingCategory) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.sourcingCategory === filters.sourcingCategory
        );
      }

      if (filters.sourcingSubCategory) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.sourcingSubCategory === filters.sourcingSubCategory
        );
      }

      if (filters.sourcingDetailCategory) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.sourcingDetailCategory === filters.sourcingDetailCategory
        );
      }

      if (filters.supplierName) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.supplierName.includes(filters.supplierName)
        );
      }

      return filteredSuppliers;
    }
  }
);

// 협력업체 상세 조회
export const fetchSupplierById = createAsyncThunk(
  'supplier/fetchSupplierById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/supplier-registrations/${id}`);
      return response.data;
    } catch (error) {
      // API 호출 실패 시 더미 데이터에서 찾아서 반환 (개발용)
      console.log('API 호출 실패, 더미 데이터 사용:', error);
      const supplier = dummySuppliers.find(sup => sup.id.toString() === id.toString());
      if (supplier) {
        return supplier;
      }
      return rejectWithValue('협력업체를 찾을 수 없습니다.');
    }
  }
);

// 협력업체 등록 요청
export const registerSupplier = createAsyncThunk(
  'supplier/registerSupplier',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/supplier-registrations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      // API 호출 실패 시 더미 응답 생성 (개발용)
      console.log('API 호출 실패, 더미 응답 생성:', error);

      // formData에서 필요한 값 추출
      const businessNo = formData.get('businessNo');
      const ceoName = formData.get('ceoName');
      const businessType = formData.get('businessType');
      const businessCategory = formData.get('businessCategory');
      const sourcingCategory = formData.get('sourcingCategory');
      const sourcingSubCategory = formData.get('sourcingSubCategory');
      const sourcingDetailCategory = formData.get('sourcingDetailCategory');
      const contactPerson = formData.get('contactPerson');
      const contactEmail = formData.get('contactEmail');
      const contactPhone = formData.get('contactPhone');

      // 새 더미 데이터 생성
      const newSupplier = {
        id: dummySuppliers.length + 1,
        supplierName: `${ceoName || '신규'}의 회사`,
        businessNo: businessNo || '999-99-99999',
        ceoName: ceoName || '신규 대표',
        businessType: businessType || '제조업',
        businessCategory: businessCategory || '기타',
        sourcingCategory: sourcingCategory || '기타',
        sourcingSubCategory: sourcingSubCategory || '기타',
        sourcingDetailCategory: sourcingDetailCategory || '기타',
        contactPerson: contactPerson || '담당자',
        contactEmail: contactEmail || 'contact@example.com',
        contactPhone: contactPhone || '010-0000-0000',
        status: 'PENDING',
        businessFile: 'dummy-new-file.pdf',
        registrationDate: new Date().toISOString().split('T')[0]
      };

      return newSupplier;
    }
  }
);

// 협력업체 승인/거절
export const updateSupplierStatus = createAsyncThunk(
  'supplier/updateSupplierStatus',
  async ({ id, status, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/supplier-registrations/${id}/status`, {
        status,
        rejectionReason
      });
      return { id, status, rejectionReason };
    } catch (error) {
      // API 호출 실패 시 더미 응답 생성 (개발용)
      console.log('API 호출 실패, 더미 응답 생성:', error);
      return { id, status, rejectionReason };
    }
  }
);

const initialState = {
  suppliers: [...dummySuppliers], // 초기 상태에 더미 데이터 설정
  currentSupplier: null,
  loading: false,
  error: null,
  success: false,
  message: '',
  // 소싱 카테고리 목록 (더미 데이터)
  sourcingCategories: [
    { value: "전자", label: "전자" },
    { value: "원료", label: "원료" },
    { value: "소프트웨어", label: "소프트웨어" },
    { value: "부품", label: "부품" },
    { value: "경영", label: "경영" },
    { value: "기타", label: "기타" }
  ],
  sourcingSubCategories: {
    "전자": [
      { value: "반도체", label: "반도체" },
      { value: "디스플레이", label: "디스플레이" },
      { value: "배터리", label: "배터리" }
    ],
    "원료": [
      { value: "금속", label: "금속" },
      { value: "화학", label: "화학" },
      { value: "섬유", label: "섬유" }
    ],
    "소프트웨어": [
      { value: "개발", label: "개발" },
      { value: "설계", label: "설계" },
      { value: "유지보수", label: "유지보수" }
    ],
    "부품": [
      { value: "자동차부품", label: "자동차부품" },
      { value: "전자부품", label: "전자부품" },
      { value: "기계부품", label: "기계부품" }
    ],
    "경영": [
      { value: "조직관리", label: "조직관리" },
      { value: "인사", label: "인사" },
      { value: "회계", label: "회계" }
    ],
    "기타": [
      { value: "기타", label: "기타" }
    ]
  },
  sourcingDetailCategories: {
    "반도체": [
      { value: "메모리", label: "메모리" },
      { value: "프로세서", label: "프로세서" }
    ],
    "금속": [
      { value: "철강", label: "철강" },
      { value: "알루미늄", label: "알루미늄" }
    ],
    "개발": [
      { value: "웹서비스", label: "웹서비스" },
      { value: "모바일앱", label: "모바일앱" }
    ],
    "자동차부품": [
      { value: "엔진부품", label: "엔진부품" },
      { value: "섀시부품", label: "섀시부품" }
    ],
    "조직관리": [
      { value: "인사관리", label: "인사관리" },
      { value: "조직문화", label: "조직문화" }
    ]
  }
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
    }
  },
  extraReducers: (builder) => {
    builder
      // 목록 조회
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
        state.error = action.payload || '협력업체 목록을 불러오는데 실패했습니다.';
      })

      // 상세 조회
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
        state.error = action.payload || '협력업체 정보를 불러오는데 실패했습니다.';
      })

      // 등록 요청
      .addCase(registerSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = '협력업체 등록 요청이 완료되었습니다.';
        state.suppliers.push(action.payload);
      })
      .addCase(registerSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '협력업체 등록 요청에 실패했습니다.';
        state.success = false;
      })

      // 승인/거절
      .addCase(updateSupplierStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupplierStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;

        // 상태 업데이트
        const updatedSupplier = state.suppliers.find(supplier => supplier.id === action.payload.id);
        if (updatedSupplier) {
          updatedSupplier.status = action.payload.status;
          if (action.payload.rejectionReason) {
            updatedSupplier.rejectionReason = action.payload.rejectionReason;
          }
        }

        // 현재 선택된 공급자인 경우 해당 정보도 업데이트
        if (state.currentSupplier && state.currentSupplier.id === action.payload.id) {
          state.currentSupplier.status = action.payload.status;
          if (action.payload.rejectionReason) {
            state.currentSupplier.rejectionReason = action.payload.rejectionReason;
          }
        }

        state.message = action.payload.status === 'APPROVED' ?
          '협력업체가 승인되었습니다.' : '협력업체가 거절되었습니다.';
      })
      .addCase(updateSupplierStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '상태 업데이트에 실패했습니다.';
      });
  }
});

export const { resetSupplierState, clearCurrentSupplier } = supplierSlice.actions;
export default supplierSlice.reducer;