// 상태 및 타입 정의 모듈

/**
 * 입찰 상태 열거형
 * @enum {string}
 */
export const BiddingStatus = {
  PENDING: "PENDING",
  ONGOING: "ONGOING",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED"
};

/**
 * 입찰 방식 열거형
 * @enum {string}
 */
export const BiddingMethod = {
  FIXED_PRICE: "FIXED_PRICE",
  OPEN_PRICE: "PRICE_SUGGESTION"
};

/**
 * 사용자 역할 열거형
 * @enum {string}
 */
export const UserRole = {
  ADMIN: "ADMIN",
  BUYER: "BUYER",
  SUPPLIER: "SUPPLIER",
  STAFF: "STAFF",
  ASSISTANT_MANAGER: "ASSISTANT_MANAGER",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "SENIOR_MANAGER"
};

/**
 * 비즈니스 타입 열거형
 * @enum {string}
 */
export const BusinessTypes = {
  MANUFACTURING: "제조업",
  WHOLESALE: "도소매업",
  SERVICE: "서비스업",
  DISTRIBUTION: "유통업",
  IT: "정보통신업"
};

/**
 * 소싱 카테고리 열거형
 * @enum {string}
 */
export const SourcingCategories = {
  OFFICE_EQUIPMENT: "사무기기",
  STATIONERY: "문구류",
  FURNITURE: "가구",
  IT_EQUIPMENT: "IT장비",
  CONSUMABLES: "소모품"
};

/**
 * 구매 요청 타입별 비즈니스 타입 매핑
 * @type {Object.<string, string[]>}
 */
export const PurchaseRequestBusinessTypeMap = {
  SI: [BusinessTypes.IT, BusinessTypes.SERVICE, BusinessTypes.MANUFACTURING],
  GOODS: [
    BusinessTypes.WHOLESALE,
    BusinessTypes.DISTRIBUTION,
    BusinessTypes.MANUFACTURING
  ],
  MAINTENANCE: [BusinessTypes.SERVICE, BusinessTypes.IT]
};

/**
 * 품목별 소싱 카테고리 매핑
 * @type {Object.<string, string[]>}
 */
export const ItemSourcingCategoryMap = {
  // IT 관련 품목
  컴퓨터: [SourcingCategories.IT_EQUIPMENT],
  노트북: [SourcingCategories.IT_EQUIPMENT],
  서버: [SourcingCategories.IT_EQUIPMENT],
  데스크탑: [SourcingCategories.IT_EQUIPMENT],

  // 사무기기 품목
  프린터: [
    SourcingCategories.OFFICE_EQUIPMENT,
    SourcingCategories.IT_EQUIPMENT
  ],
  복합기: [SourcingCategories.OFFICE_EQUIPMENT],
  스캐너: [
    SourcingCategories.OFFICE_EQUIPMENT,
    SourcingCategories.IT_EQUIPMENT
  ],

  // 가구 품목
  책상: [SourcingCategories.FURNITURE],
  의자: [SourcingCategories.FURNITURE],
  캐비닛: [SourcingCategories.FURNITURE],

  // 문구류 품목
  볼펜: [SourcingCategories.STATIONERY],
  노트: [SourcingCategories.STATIONERY],
  파일: [SourcingCategories.STATIONERY],

  // 소모품 품목
  토너: [SourcingCategories.CONSUMABLES],
  잉크: [SourcingCategories.CONSUMABLES],
  카트리지: [SourcingCategories.CONSUMABLES],
  종이: [SourcingCategories.CONSUMABLES, SourcingCategories.STATIONERY]
};

/**
 * 과금 단위 목록
 * @type {Array<{value: string, label: string}>}
 */
export const BillingUnits = [
  { value: "EA", label: "개" },
  { value: "BOX", label: "박스" },
  { value: "SET", label: "세트" },
  { value: "BAG", label: "봉지" },
  { value: "KG", label: "킬로그램" },
  { value: "M", label: "미터" }
];

/**
 * 아이템 카테고리 목록
 * @type {Array<{value: string, label: string, description: string}>}
 */
export const ItemCategories = [
  {
    value: "사무기기",
    label: "사무기기",
    description: "프린터, 복합기 등 사무용 기기"
  },
  {
    value: "문구류",
    label: "문구류",
    description: "필기구, 노트류 등 사무용 문구"
  },
  {
    value: "가구",
    label: "가구",
    description: "책상, 의자, 수납장 등 사무용 가구"
  },
  {
    value: "IT장비",
    label: "IT장비",
    description: "컴퓨터, 모니터, 네트워크 장비 등"
  },
  {
    value: "소모품",
    label: "소모품",
    description: "토너, 용지 등 일회성 소모성 자재"
  }
];

/**
 * 카테고리 설명 조회
 * @param {string} categoryName - 카테고리명
 * @returns {string} 카테고리 설명
 */
export function getCategoryDescription(categoryName) {
  const category = ItemCategories.find((cat) => cat.value === categoryName);
  return category ? category.description : "";
}

/**
 * 카테고리별 아이템 목록 조회
 * @param {string} categoryName - 카테고리명
 * @returns {string[]} 아이템 목록
 */
export function getItemsByCategory(categoryName) {
  const categoryMap = {
    사무기기: ["프린터", "복합기", "스캐너"],
    문구류: ["볼펜", "노트", "포스트잇"],
    가구: ["책상", "의자", "서랍장"],
    IT장비: ["노트북", "모니터", "키보드"],
    소모품: ["토너", "용지", "잉크"]
  };
  return categoryMap[categoryName] || [];
}

/**
 * 구매 요청에서 카테고리 추출
 * @param {Object} purchaseRequest - 구매 요청 객체
 * @returns {Object} 추천 카테고리 정보
 */
export function extractCategoriesFromPurchaseRequest(purchaseRequest) {
  const result = {
    businessTypes: [],
    sourcingCategories: []
  };

  if (!purchaseRequest) return result;

  // 구매 요청 타입에 따른 비즈니스 타입 추천
  if (purchaseRequest.requestType) {
    result.businessTypes =
      PurchaseRequestBusinessTypeMap[purchaseRequest.requestType] || [];
  }

  // 품목에 따른 소싱 카테고리 추천
  const items = purchaseRequest.items || [];

  if (items.length > 0) {
    const sourcingCategoriesSet = new Set();

    items.forEach((item) => {
      const itemName = item.itemName || item.specification || "";

      // 품목명에 키워드가 포함되어 있는지 확인하여 소싱 카테고리 추출
      Object.keys(ItemSourcingCategoryMap).forEach((keyword) => {
        if (itemName.toLowerCase().includes(keyword.toLowerCase())) {
          ItemSourcingCategoryMap[keyword].forEach((category) =>
            sourcingCategoriesSet.add(category)
          );
        }
      });
    });

    result.sourcingCategories = Array.from(sourcingCategoriesSet);
  }

  return result;
}

/**
 * 입찰 공고 기본 인터페이스
 * @type {Object}
 */
export const BiddingShape = {
  id: null,
  bidNumber: "",
  title: "",
  status: {
    childCode: BiddingStatus.PENDING
  },
  bidMethod: BiddingMethod.FIXED_PRICE,
  startDate: null,
  endDate: null,
  selectedParticipationId: null,
  participations: [],
  suppliers: [],
  contracts: [],
  orders: []
};

/**
 * 공급사 참여 기본 인터페이스
 * @type {Object}
 */
export const BiddingParticipationShape = {
  id: null,
  biddingId: null,
  supplierId: null,
  companyName: "",
  unitPrice: 0,
  supplyPrice: 0,
  vat: 0,
  totalAmount: 0,
  submittedAt: null,
  isConfirmed: false,
  confirmedAt: null,
  isEvaluated: false,
  evaluationScore: null,
  isOrderCreated: false,
  isSelectedBidder: false,
  selectedAt: null
};
