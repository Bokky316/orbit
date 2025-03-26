import { BiddingStatus, BiddingMethod, BillingUnits } from "./biddingTypes";
import moment from "moment";

// 초기 폼 데이터
export const INITIAL_FORM_DATA = {
  requestNumber: "",
  requestName: "",
  title: "",
  purchaseRequestId: null,
  purchaseRequestItemId: null,
  purchaseRequestItems: [],
  selectedItems: [],
  description: "",
  suppliers: [],
  bidMethod: BiddingMethod.FIXED_PRICE,
  status: {
    parentCode: "BIDDING",
    childCode: BiddingStatus.PENDING
  },
  startDate: "",
  endDate: "",
  quantity: 1,
  unitPrice: 0,
  supplyPrice: 0,
  vat: 0,
  totalAmount: 0,
  biddingConditions: "",
  conditions: "",
  internalNote: "",
  deliveryLocation: "",
  deliveryDate: "",
  billingUnit: "EA",
  files: []
};

export const getStatusText = (status) => {
  const statusMap = {
    PENDING: "대기중",
    ONGOING: "진행중",
    CLOSED: "마감",
    CANCELED: "취소"
  };

  if (typeof status === "string") {
    return statusMap[status] || "대기중";
  }

  return status?.childCode ? statusMap[status.childCode] : "대기중";
};

export const getBidMethodText = (method) => {
  const methodMap = {
    [BiddingMethod.FIXED_PRICE]: "정가제안",
    [BiddingMethod.OPEN_PRICE]: "가격제안"
  };

  return methodMap[method] || "정가제안";
};

/**
 * 숫자를 포맷팅하여 천 단위 구분 기호가 있는 문자열로 변환합니다.
 * @param {number} number - 포맷팅할 숫자
 * @returns {string} 포맷팅된 문자열
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return "0";

  // 숫자가 아닌 경우 숫자로 변환 시도
  const num = Number(number);
  if (isNaN(num)) return "0";

  // 천 단위 구분 기호로 포맷팅
  return num.toLocaleString("ko-KR");
};

/**
 * 단위 코드 ID에 해당하는 코드값을 반환합니다.
 * @param {string|number} unitCodeId - 단위 코드 ID (예: "49", 49 등)
 * @returns {string} 단위 코드값 (예: "EA", "BOX" 등)
 */
export const getUnitCodeById = (unitCodeId) => {
  // DB 테이블 기준 매핑
  const codeMap = {
    49: "EA", // 개
    50: "BOX", // 박스
    51: "BAG", // 봉지
    52: "SET", // 세트
    53: "KG", // 킬로그램
    54: "M" // 미터
  };
  return codeMap[String(unitCodeId)] || "EA";
};

/**
 * 단위 코드 ID에 해당하는 표시 이름을 반환합니다.
 * @param {string|number} unitCodeId - 단위 코드 ID (예: "49", 49 등)
 * @returns {string} 단위 표시 이름 (예: "개", "박스" 등)
 */
export const getUnitDisplayNameById = (unitCodeId) => {
  // DB 테이블 기준 매핑
  const displayNameMap = {
    49: "개",
    50: "박스",
    51: "봉지",
    52: "세트",
    53: "킬로그램",
    54: "미터"
  };
  return displayNameMap[String(unitCodeId)] || "개";
};

/**
 * 문자열로 된 가격 정보를 숫자로 변환합니다.
 * @param {string|number} priceStr - 가격 문자열 (예: "10,000,000")
 * @returns {number} 숫자 형식의 가격
 */
export const parsePrice = (priceStr) => {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseFloat(String(priceStr).replace(/,/g, "")) || 0;
};

/**
 * 임의의 단위 코드를 표준화된 코드값으로 변환합니다.
 * ID, 코드값, 이름 등 다양한 형태의 입력을 처리합니다.
 * @param {string|number} unitCode - 단위 코드 (ID, 코드값, 이름 등)
 * @returns {string} 표준화된 단위 코드값 (EA, BOX 등)
 */
export const normalizeUnitCode = (unitCode) => {
  if (!unitCode) return "EA";

  const codeStr = String(unitCode);

  // 이미 코드값인 경우
  if (["EA", "BOX", "BAG", "SET", "KG", "M"].includes(codeStr)) {
    return codeStr;
  }

  // ID인 경우
  if (["49", "50", "51", "52", "53", "54"].includes(codeStr)) {
    return getUnitCodeById(codeStr);
  }

  // 이름인 경우
  const nameToCodeMap = {
    개: "EA",
    박스: "BOX",
    봉지: "BAG",
    세트: "SET",
    킬로그램: "KG",
    미터: "M"
  };

  if (nameToCodeMap[codeStr]) {
    return nameToCodeMap[codeStr];
  }

  // 기존 함수로 확인 (BillingUnits 배열 활용)
  const foundUnit = BillingUnits.find(
    (unit) => unit.value === codeStr || unit.label === codeStr
  );
  if (foundUnit) {
    return foundUnit.value;
  }

  // 기본값
  return "EA";
};

export const transformFormDataToApiFormat = (formData, user) => {
  console.log("변환 전 폼 데이터:", formData);

  // 안전한 숫자 변환 함수
  const ensurePositiveNumber = (value) => {
    if (typeof value === "number" && !isNaN(value) && value >= 0) return value;
    const parsed = parseFloat(String(value).replace(/,/g, ""));
    return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
  };

  // 필수 필드 확인
  if (!formData.purchaseRequestItemId) {
    throw new Error("구매 요청 품목 ID가 필요합니다.");
  }

  if (!formData.title && !formData.requestName) {
    throw new Error("제목이 필요합니다.");
  }

  // 사용자 정보
  const userId = user?.id || null;
  const username = user?.username || user?.email || "system";

  // 입찰 기간 (biddingPeriod 객체로 전송)
  const biddingPeriod = {
    startDate: formData.startDate
      ? moment(formData.startDate).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD"),
    endDate: formData.deadline
      ? moment(formData.deadline).format("YYYY-MM-DD")
      : null
  };

  // 금액 계산
  const quantity = ensurePositiveNumber(formData.quantity) || 1;
  const unitPrice = ensurePositiveNumber(formData.unitPrice) || 0;
  const supplyPrice =
    ensurePositiveNumber(formData.supplyPrice) || quantity * unitPrice;
  const vat =
    ensurePositiveNumber(formData.vat) || Math.round(supplyPrice * 0.1);
  const totalAmount =
    ensurePositiveNumber(formData.totalAmount) || supplyPrice + vat;

  // API 요청 데이터
  const apiData = {
    // 구매 요청 정보
    purchaseRequestId: parseInt(formData.purchaseRequestId, 10) || null,
    purchaseRequestItemId: parseInt(formData.purchaseRequestItemId, 10) || null,

    // 제목 및 설명
    title: formData.title || formData.requestName || "",
    description: formData.description || "",

    // 중요: conditions 필드는 biddingConditions에서 가져옴
    conditions: formData.biddingConditions || formData.conditions || "",
    internalNote: formData.internalNote || "",

    // 두 필드 모두 포함 - method와 bidMethod
    method: formData.bidMethod || "FIXED_PRICE",
    bidMethod: formData.bidMethod || "FIXED_PRICE", // bidMethod 필드 추가

    // 상태 정보 - 객체가 아닌 문자열로 전송
    status: formData.status?.childCode || "PENDING",

    // 입찰 기간 - 객체 형태로 전송
    biddingPeriod: biddingPeriod,

    // 금액 필드
    quantity: quantity,
    unitPrice: unitPrice,
    supplyPrice: supplyPrice,
    vat: vat,
    totalAmount: totalAmount,

    // 납품 정보 - deliveryDate와 deliveryRequestDate 둘 다 포함
    deliveryLocation: formData.deliveryLocation || "",
    deliveryDate: formData.deliveryDate
      ? moment(formData.deliveryDate).format("YYYY-MM-DD")
      : null,
    // 백엔드 호환성을 위해 두 필드 모두 포함
    deliveryRequestDate: formData.deliveryDate
      ? moment(formData.deliveryDate).format("YYYY-MM-DD")
      : null,

    // 공급사 정보 - 배열 형식 유지하며 안전하게 변환
    supplierIds: Array.isArray(formData.suppliers)
      ? formData.suppliers
          .map((s) => {
            // 공급자 객체인 경우 ID 추출
            if (typeof s === "object" && s !== null) {
              return typeof s.id === "string" ? parseInt(s.id, 10) : s.id;
            }
            // 이미 ID인 경우
            return typeof s === "string" ? parseInt(s, 10) : s;
          })
          .filter((id) => !isNaN(id) && id > 0) // 유효한 ID만 포함
      : []
  };

  // 디버깅 로그
  console.log("변환 후 API 데이터:", apiData);
  console.log("purchaseRequestId:", apiData.purchaseRequestId);
  console.log("purchaseRequestItemId:", apiData.purchaseRequestItemId);
  console.log("method:", apiData.method);
  console.log("biddingPeriod:", apiData.biddingPeriod);
  console.log("conditions:", apiData.conditions);
  console.log("supplierIds:", apiData.supplierIds);

  return {
    ...apiData,
    createdBy: userId, // 생성자 ID 명시적 추가
    createdUsername: username // 생성자 이름/이메일 추가
  };
};

export const mapBiddingDataToFormData = (biddingData) => {
  console.log("백엔드에서 받은 원본 데이터:", biddingData); // 디버깅용

  let suppliers = [];

  // suppliers 필드 처리 - 백엔드 응답 구조에 맞게 수정
  if (biddingData.suppliers && Array.isArray(biddingData.suppliers)) {
    suppliers = biddingData.suppliers.map((s) => ({
      id: s.supplierId || (s.supplier && s.supplier.id),
      name:
        s.supplierName ||
        s.companyName ||
        (s.supplier && s.supplier.companyName),
      companyName:
        s.supplierName ||
        s.companyName ||
        (s.supplier && s.supplier.companyName)
    }));
  }

  // 선택된 품목 ID 배열 처리
  let selectedItems = [];
  if (biddingData.selectedItems) {
    // 콤마로 구분된 문자열인 경우
    if (typeof biddingData.selectedItems === "string") {
      selectedItems = biddingData.selectedItems
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));
    }
    // 이미 배열인 경우
    else if (Array.isArray(biddingData.selectedItems)) {
      selectedItems = biddingData.selectedItems;
    }
  }

  // biddingPeriod 처리
  let startDate = null;
  let endDate = null;

  if (biddingData.biddingPeriod) {
    startDate = biddingData.biddingPeriod.startDate
      ? moment(biddingData.biddingPeriod.startDate)
      : null;
    endDate = biddingData.biddingPeriod.endDate
      ? moment(biddingData.biddingPeriod.endDate)
      : null;
  } else {
    // 기존 방식의 호환성 유지
    startDate = biddingData.startDate ? moment(biddingData.startDate) : null;
    endDate = biddingData.endDate ? moment(biddingData.endDate) : null;
  }

  const biddingPeriod = {
    startDate: startDate,
    endDate: endDate
  };

  // 필드명 매핑 수정
  return {
    requestNumber: biddingData.purchaseRequest?.requestNumber || "", // requestNumber로 변경
    purchaseRequestItemId: biddingData.purchaseRequestItemId?.toString() || "",
    requestName: biddingData.title || "", // requestName으로 변경
    purchaseRequestItems: biddingData.purchaseRequestItems || [],
    selectedItems: selectedItems,
    suppliers: suppliers,
    description: biddingData.description || "",
    quantity: biddingData.quantity || 0,
    unitPrice: biddingData.unitPrice || 0,
    supplyPrice: biddingData.supplyPrice || 0,
    vat: biddingData.vat || 0,
    totalAmount: biddingData.totalAmount || 0,
    biddingConditions: biddingData.conditions || "",
    deadline: biddingData.endDate
      ? new Date(biddingData.endDate).toISOString().split("T")[0]
      : "",
    bidMethod: biddingData.bidMethod || BiddingMethod.FIXED_PRICE,
    status: biddingData.status || {
      parentCode: "BIDDING",
      childCode: BiddingStatus.PENDING
    },
    deliveryLocation: biddingData.deliveryLocation || "",
    deliveryDate: biddingData.deliveryDate
      ? new Date(biddingData.deliveryDate).toISOString().split("T")[0]
      : "",
    billingUnit: biddingData.billingUnit || "EA",
    internalNote: biddingData.internalNote || "",
    biddingPeriod: biddingPeriod,
    startDate: startDate,
    endDate: endDate
  };
};
