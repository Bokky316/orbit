import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { API_URL } from '../../utils/constants';

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
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 1,
        fileName: "business_cert.pdf",
        filePath: "supplier_1/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 125000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "APPROVED"
    },
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
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 2,
        fileName: "business_cert.pdf",
        filePath: "supplier_2/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 145000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "PENDING"
    },
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
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 3,
        fileName: "business_cert.pdf",
        filePath: "supplier_3/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 165000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "REJECTED"
    },
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
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 4,
        fileName: "business_cert.pdf",
        filePath: "supplier_4/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 185000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "APPROVED"
    },
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
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 5,
        fileName: "business_cert.pdf",
        filePath: "supplier_5/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 205000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "PENDING"
    },
    registrationDate: "2023-05-18",
    contactPerson: "정담당",
    contactEmail: "contact@paha.com",
    contactPhone: "010-5678-9012"
  },
  {
    id: 6,
    supplierName: "블랙리스트업체(주)",
    businessNo: "678-90-12345",
    ceoName: "한대표",
    businessType: "제조업",
    businessCategory: "금속",
    sourcingCategory: "원료",
    sourcingSubCategory: "금속",
    sourcingDetailCategory: "알루미늄",
    phoneNumber: "02-6789-0123",
    headOfficeAddress: "경기도 안산시 산업로 202",
    comments: "알루미늄 제조 전문업체입니다.",
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 6,
        fileName: "business_cert.pdf",
        filePath: "supplier_6/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 225000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "BLACKLIST"
    },
    rejectionReason: "품질 불량 문제 및 납기 지연 반복",
    registrationDate: "2023-01-05",
    contactPerson: "한담당",
    contactEmail: "contact@blacklist.com",
    contactPhone: "010-6789-0123"
  },
  {
    id: 7,
    supplierName: "일시정지물산(주)",
    businessNo: "789-01-23456",
    ceoName: "노사장",
    businessType: "도매업",
    businessCategory: "화학",
    sourcingCategory: "원료",
    sourcingSubCategory: "화학",
    sourcingDetailCategory: "",
    phoneNumber: "02-7890-1234",
    headOfficeAddress: "충청남도 천안시 공단로 303",
    comments: "화학 원료 공급업체입니다.",
    // 첨부 파일 구조 변경
    attachments: [
      {
        id: 7,
        fileName: "business_cert.pdf",
        filePath: "supplier_7/business_cert.pdf",
        fileType: "application/pdf",
        fileSize: 245000
      }
    ],
    status: {
      parentCode: "SUPPLIER",
      childCode: "SUSPENDED"
    },
    suspensionReason: "업체 내부 점검으로 인한 일시적 거래 중단",
    registrationDate: "2023-02-20",
    contactPerson: "노담당",
    contactEmail: "contact@suspended.com",
    contactPhone: "010-7890-1234"
  }
];

// 협력업체 목록 조회
export const fetchSuppliers = createAsyncThunk(
  'supplier/fetchSuppliers',
  async (filters = {}, { rejectWithValue }) => {
    try {
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
        queryParams.push(`sourcingDetailCategory=${filters.sourcingDetailCategory}`);
      }
      if (filters.supplierName) {
        queryParams.push(`supplierName=${filters.supplierName}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const response = await fetchWithAuth(url);

      // HTML 응답 방지 처리 (purchaseRequestSlice에서 가져옴)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || '데이터 로드 실패');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // HTML 응답 시 별도 처리 (purchaseRequestSlice에서 가져옴)
      if (error.message.includes('Invalid content type')) {
        return rejectWithValue('서버 응답 형식 오류');
      }

      console.log('API 호출 실패, 더미 데이터 사용:', error);
      let filteredSuppliers = [...dummySuppliers];
      if (filters.status) {
        filteredSuppliers = filteredSuppliers.filter(supplier =>
          supplier.status.childCode === filters.status
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
      const response = await fetchWithAuth(`${API_URL}supplier-registrations/${id}/detail`);

      // HTML 응답 방지 처리
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || '데이터 로드 실패');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes('Invalid content type')) {
        return rejectWithValue('서버 응답 형식 오류');
      }

      console.log('API 호출 실패, 더미 데이터 사용:', error);
      const supplier = dummySuppliers.find(sup => sup.id.toString() === id.toString());
      if (supplier) {
        return supplier;
      }
      return rejectWithValue('협력업체를 찾을 수 없습니다.');
    }
  }
);

// 협력업체 등록 요청 - FormData 처리 방식으로 수정
export const registerSupplier = createAsyncThunk(
  'supplier/registerSupplier',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}supplier-registrations`, {
        method: 'POST',
        body: formData, // FormData 객체 그대로 전송 (Content-Type 헤더 자동 설정)
      });

      // HTML 응답 방지 처리
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || '등록 실패');
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes('Invalid content type')) {
        return rejectWithValue('서버 응답 형식 오류');
      }

      console.error('API 요청 실패:', error);
      return rejectWithValue(error.message || '등록 요청 중 오류 발생');
    }
  }
);

// 첨부 파일 다운로드 액션 추가
export const downloadAttachment = createAsyncThunk(
  'supplier/downloadAttachment',
  async (attachmentId, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}supplier-registrations/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`서버 응답 오류 (${response.status}): ${error}`);
      }

      // 헤더에서 파일명 추출
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'unnamed_file';

      return {
        blob: await response.blob(),
        fileName: decodeURIComponent(fileName)
      };
    } catch (error) {
      return rejectWithValue(error.toString());
    }
  }
);

// 협력업체 승인/거절
export const updateSupplierStatus = createAsyncThunk(
  'supplier/updateSupplierStatus',
  async ({ id, statusCode, rejectionReason }, { rejectWithValue }) => {
    try {
      const response = await fetchWithAuth(`${API_URL}supplier-registrations/status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ statusCode, rejectionReason })
      });

      // HTML 응답 방지 처리
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || '상태 업데이트 실패');
      }

      return { id, statusCode, rejectionReason };
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes('Invalid content type')) {
        return rejectWithValue('서버 응답 형식 오류');
      }

      console.log('API 호출 실패:', error);
      return rejectWithValue(error.message || '상태 업데이트 요청 중 오류 발생');
    }
  }
);

// 첨부 파일 추가 액션
export const addAttachmentsToSupplier = createAsyncThunk(
  'supplier/addAttachmentsToSupplier',
  async ({ id, files }, { rejectWithValue }) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 파일 추가
      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await fetchWithAuth(`${API_URL}supplier-registrations/${id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      // HTML 응답 방지 처리
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || '파일 업로드 실패');
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // HTML 응답 시 별도 처리
      if (error.message.includes('Invalid content type')) {
        return rejectWithValue('서버 응답 형식 오류');
      }

      console.error('API 요청 실패:', error);
      return rejectWithValue(error.message || '파일 업로드 요청 중 오류 발생');
    }
  }
);

/**
 * 초기 상태 정의
 */
const initialState = {
  suppliers: [...dummySuppliers], // 초기 상태에 더미 데이터 설정
  currentSupplier: null,
  loading: false,
  error: null,
  success: false,
  message: '',
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
        state.error = action.payload || '협력업체 목록을 불러오는데 실패했습니다.';
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
        state.error = action.payload || '협력업체 정보를 불러오는데 실패했습니다.';
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
        state.message = '협력업체 등록 요청이 완료되었습니다.';
        if (action.payload) {
          state.suppliers.push(action.payload);
        }
      })
      .addCase(registerSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '협력업체 등록 요청에 실패했습니다.';
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

        const updatedSupplier = state.suppliers.find(supplier => supplier.id === action.payload.id);
        if (updatedSupplier) {
          if (!updatedSupplier.status) {
            updatedSupplier.status = { parentCode: "SUPPLIER", childCode: action.payload.statusCode };
          } else {
            updatedSupplier.status.childCode = action.payload.statusCode;
          }
          if (action.payload.rejectionReason) {
            updatedSupplier.rejectionReason = action.payload.rejectionReason;
          }

          if (state.currentSupplier && state.currentSupplier.id === action.payload.id) {
            if (!state.currentSupplier.status) {
              state.currentSupplier.status = { parentCode: "SUPPLIER", childCode: action.payload.statusCode };
            } else {
              state.currentSupplier.status.childCode = action.payload.statusCode;
            }
            if (action.payload.rejectionReason) {
              state.currentSupplier.rejectionReason = action.payload.rejectionReason;
            }
          }
        }

        switch (action.payload.statusCode) {
          case 'APPROVED':
            state.message = '협력업체가 승인되었습니다.';
            break;
          case 'REJECTED':
            state.message = '협력업체가 거절되었습니다.';
            break;
          case 'SUSPENDED':
            state.message = '협력업체가 일시정지되었습니다.';
            break;
          case 'BLACKLIST':
            state.message = '협력업체가 블랙리스트에 등록되었습니다.';
            break;
          default:
            state.message = '협력업체 상태가 변경되었습니다.';
        }
      })
      .addCase(updateSupplierStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '상태 업데이트에 실패했습니다.';
      })

      // downloadAttachment
      .addCase(downloadAttachment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(downloadAttachment.fulfilled, (state) => {
        state.loading = false;
        // 파일 다운로드는 상태에 저장하지 않고 브라우저에서 처리됨
      })
      .addCase(downloadAttachment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '파일 다운로드에 실패했습니다.';
      })

      // addAttachmentsToSupplier
      .addCase(addAttachmentsToSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAttachmentsToSupplier.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = '첨부 파일이 성공적으로 업로드되었습니다.';

        // 현재 선택된 공급업체 업데이트
        if (action.payload && state.currentSupplier && state.currentSupplier.id === action.payload.id) {
          state.currentSupplier = action.payload;
        }

        // 목록 업데이트
        const index = state.suppliers.findIndex(supplier => supplier.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.suppliers[index] = action.payload;
        }
      })
      .addCase(addAttachmentsToSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '파일 업로드에 실패했습니다.';
      });
  }
});

export const { resetSupplierState, clearCurrentSupplier } = supplierSlice.actions;
export default supplierSlice.reducer;