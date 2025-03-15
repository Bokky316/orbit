// 상태 타입 정의
export const BiddingStatus = {
  PENDING: "PENDING",
  ONGOING: "ONGOING",
  CLOSED: "CLOSED",
  CANCELED: "CANCELED"
};

// 입찰 방식 타입 정의
export const BiddingMethod = {
  FIXED_PRICE: "정가제안",
  OPEN_PRICE: "가격제안"
};

// 사용자 역할 타입 정의
export const UserRole = {
  ADMIN: "ADMIN",
  BUYER: "BUYER",
  SUPPLIER: "SUPPLIER"
};

// 입찰 공고 기본 인터페이스
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

// 공급사 참여 기본 인터페이스
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
