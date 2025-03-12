/**
 * 입찰 공고 관련 유틸리티 함수
 */

// 상태 코드 매핑 (프론트엔드 표시용)
// 서버에서 받은 status.childCode에 따라 한글 상태로 표시
export const getStatusText = (statusCode) => {
  if (!statusCode || !statusCode.childCode) return "대기중";

  const statusMap = {
    PENDING: "대기중",
    ONGOING: "진행중",
    CLOSED: "마감",
    CANCELED: "취소"
  };

  return statusMap[statusCode.childCode] || statusCode.childCode;
};

// 입찰 방식 텍스트 변환
export const getBidMethodText = (bidMethod) => {
  return bidMethod || "정가제안";
};



// 초기 폼 데이터 상수
export const INITIAL_FORM_DATA = {
  purchaseRequestCode: "",
  purchaseRequestName: "",
  suppliers: [],
  itemQuantity: 0,
  unitPrice: 0,
  supplyPrice: 0,
  vat: 0,
  billingUnit: "",
  biddingConditions: "",
  deadline: "",
  internalNote: "",
  status: { parentCode: "BIDDING", childCode: "PENDING" }, // SystemStatus 형태로 변경
  bidMethod: "정가제안"
};

// 폼 데이터를 API 요청 형식으로 변환
export const transformFormDataToApiFormat = (formData, user) => {
  // 현재 날짜
  const now = new Date();

  // 마감일이 없으면 기본값으로 7일 후로 설정
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 7);

  // 공급자 정보 처리 (회사명 기준)
  const supplierDescription = Array.isArray(formData.suppliers)
    ? formData.suppliers.map((s) => s.companyName || s.name || "").join(", ")
    : "";

  // 안전한 값 (백엔드에서 추가로 검증하므로 최소한의 처리만 수행)
  return {
    purchaseRequestId: formData.purchaseRequestCode
      ? Number(formData.purchaseRequestCode)
      : null,
    purchaseRequestItemId: formData.purchaseRequestItemId
      ? Number(formData.purchaseRequestItemId)
      : null,
    title: formData.purchaseRequestName || "",
    description: supplierDescription || formData.description || "",
    bidMethod: formData.bidMethod || "정가제안",
    status: formData.status?.childCode || "PENDING",
    startDate: formData.startDate || now.toISOString(),
    endDate: formData.deadline
      ? new Date(formData.deadline + "T23:59:59").toISOString()
      : defaultEndDate.toISOString(),
    conditions: formData.biddingConditions || formData.conditions || "",
    internalNote: formData.internalNote || "",
    quantity: Number(formData.itemQuantity) || 1,
    unitPrice: Number(formData.unitPrice) || 0,
    supplyPrice: Number(formData.supplyPrice) || 0,
    vat: Number(formData.vat) || 0,
    totalAmount: Number(formData.totalAmount) || 0,
    supplierIds: Array.isArray(formData.suppliers)
      ? formData.suppliers.map((s) => Number(s.id))
      : []
  };
};

// API 응답 데이터를 폼 데이터로 변환
export const mapBiddingDataToFormData = (biddingData) => {
  // 공급자 데이터 처리
  let suppliers = [];
  if (biddingData.supplierIds && Array.isArray(biddingData.supplierIds)) {
    // ID만 있는 경우 최소한의 객체 생성
    suppliers = biddingData.supplierIds.map((id) => ({ id }));
  }

  // description에서 공급자 이름 추출 (필요한 경우)
  if (biddingData.description && suppliers.length > 0) {
    const companyNames = biddingData.description
      .split(",")
      .map((name) => name.trim());
    companyNames.forEach((name, index) => {
      if (index < suppliers.length) {
        suppliers[index].companyName = name;
        suppliers[index].name = name; // 호환성 위해 name도 설정
      }
    });
  }

  return {
    purchaseRequestCode: biddingData.purchaseRequestId?.toString() || "",
    purchaseRequestName: biddingData.title || "",
    purchaseRequestItemId: biddingData.purchaseRequestItemId || null,
    suppliers: suppliers,
    itemQuantity: biddingData.quantity || 0,
    unitPrice: biddingData.unitPrice || 0,
    supplyPrice: biddingData.supplyPrice || 0,
    vat: biddingData.vat || 0,
    billingUnit: biddingData.billingUnit || "",
    biddingConditions: biddingData.conditions || "",
    deadline: biddingData.endDate
      ? new Date(biddingData.endDate).toISOString().split("T")[0]
      : "",
    internalNote: biddingData.internalNote || "",
    status: biddingData.status || {
      parentCode: "BIDDING",
      childCode: "PENDING"
    },
    bidMethod: biddingData.bidMethod || "정가제안",
    bidNumber: biddingData.bidNumber || "",
    createdAt: biddingData.createdAt || null,
    filePath: biddingData.filePath || "",
    totalAmount: biddingData.totalAmount || 0,
    // 상세 페이지에 필요한 추가 필드
    startDate: biddingData.startDate || null,
    endDate: biddingData.endDate || null,
    conditions: biddingData.conditions || "",
    // 상태와 입찰 방식의 표시 텍스트
    statusText: getStatusText(biddingData.status),
    bidMethodText: biddingData.bidMethod || "정가제안",
    description: biddingData.description || ""
  };
};

// 발주 데이터 준비 함수
export const prepareOrderData = (bidding, evaluationData, participation) => {
  // 현재로부터 30일 후 날짜 계산
  const expectedDeliveryDate = new Date();
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 30);

  return {
    biddingId: bidding?.id,
    biddingParticipationId: evaluationData?.biddingParticipationId,
    biddingItemId: bidding?.purchaseRequestItemId || 0,
    supplierId: participation?.supplierId,
    supplierName: participation?.supplierName,
    title: bidding?.title || "",
    description: bidding?.description || "",
    quantity: bidding?.quantity || 1,
    unitPrice: participation?.unitPrice || 0,
    supplyPrice: participation?.supplyPrice || 0,
    vat: participation?.vat || 0,
    totalAmount: participation?.totalAmount || 0,
    terms: bidding?.conditions || "",
    expectedDeliveryDate: expectedDeliveryDate.toISOString().split("T")[0],
    isSelectedBidder: true,
    bidderSelectedAt: new Date().toISOString()
  };
};

// 발주 목록 데이터 정렬 및 가공
export const processOrderList = (orders) => {
  if (!Array.isArray(orders)) return [];

  // 최신 순으로 정렬
  const sortedOrders = [...orders].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  // 데이터 가공
  return sortedOrders.map((order) => ({
    ...order,
    formattedDate: order.createdAt
      ? new Date(order.createdAt).toLocaleDateString()
      : "-",
    formattedDeliveryDate: order.expectedDeliveryDate
      ? new Date(order.expectedDeliveryDate).toLocaleDateString()
      : "-",
    formattedAmount: order.totalAmount
      ? order.totalAmount.toLocaleString() + "원"
      : "0원"
  }));
};
