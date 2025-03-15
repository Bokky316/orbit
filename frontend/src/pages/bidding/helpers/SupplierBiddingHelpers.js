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

/**
 * 입찰 참여 가능 여부 확인
 * @param {Object} bidding - 입찰 공고 객체
 * @param {string} userRole - 사용자 역할
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {boolean} 참여 가능 여부
 */
export const canParticipateInBidding = (
  bidding,
  userRole,
  userSupplierInfo
) => {
  if (!bidding || userRole !== UserRole.SUPPLIER || !userSupplierInfo)
    return false;

  const now = new Date();
  const endDate = bidding.endDate ? new Date(bidding.endDate) : null;

  const isOngoing = bidding.status?.childCode === BiddingStatus.ONGOING;
  const isNotExpired = !endDate || now <= endDate;
  const hasNotParticipated = !hasAlreadyParticipated(bidding, userSupplierInfo);
  const canParticipateByMethod = checkMethodParticipation(
    bidding,
    userSupplierInfo
  );

  return (
    isOngoing && isNotExpired && hasNotParticipated && canParticipateByMethod
  );
};

/**
 * 이미 입찰에 참여했는지 확인
 * @param {Object} bidding - 입찰 공고 객체
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {boolean} 이미 참여 여부
 */
const hasAlreadyParticipated = (bidding, userSupplierInfo) => {
  return (
    bidding.participations?.some((p) => p.supplierId === userSupplierInfo.id) ??
    false
  );
};

/**
 * 입찰 방식에 따른 참여 가능 여부 확인
 * @param {Object} bidding - 입찰 공고 객체
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {boolean} 참여 가능 여부
 */
const checkMethodParticipation = (bidding, userSupplierInfo) => {
  return bidding.bidMethod === BiddingMethod.FIXED_PRICE
    ? bidding.suppliers?.some((s) => s.supplierId === userSupplierInfo.id)
    : true;
};

/**
 * 입찰 금액 계산
 * @param {number} unitPrice - 단가
 * @param {number} quantity - 수량
 * @returns {Object} 공급가액, 부가세, 총액
 */
export const calculateParticipationAmount = (unitPrice, quantity) => {
  if (!unitPrice || !quantity) {
    return {
      supplyPrice: 0,
      vat: 0,
      totalAmount: 0
    };
  }

  const supplyPrice = unitPrice * quantity;
  const vat = Math.round(supplyPrice * 0.1);
  const totalAmount = supplyPrice + vat;

  return { supplyPrice, vat, totalAmount };
};

/**
 * 입찰 제안 유효성 검증
 * @param {number} unitPrice - 단가
 * @param {number} quantity - 수량
 * @returns {Object} 유효성 검증 결과
 */
export const validatePriceProposal = (unitPrice, quantity) => {
  const errors = {};

  if (!unitPrice || unitPrice <= 0) {
    errors.unitPrice = "단가는 0보다 커야 합니다.";
  }

  if (!quantity || quantity <= 0) {
    errors.quantity = "수량은 0보다 커야 합니다.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * 참여 가능한 입찰 공고 필터링
 * @param {Array} biddings - 입찰 공고 목록
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {Array} 참여 가능한 입찰 공고 목록
 */
export const filterParticipableBiddings = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) =>
    canParticipateInBidding(bidding, UserRole.SUPPLIER, userSupplierInfo)
  );
};

/**
 * 참여한 입찰 공고 필터링
 * @param {Array} biddings - 입찰 공고 목록
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {Array} 참여한 입찰 공고 목록
 */
export const filterMyParticipations = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) =>
    bidding.participations?.some((p) => p.supplierId === userSupplierInfo.id)
  );
};

/**
 * 초대된 입찰 공고 필터링
 * @param {Array} biddings - 입찰 공고 목록
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {Array} 초대된 입찰 공고 목록
 */
export const filterInvitedBiddings = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) => {
    const isOngoing = bidding.status?.childCode === BiddingStatus.ONGOING;
    const now = new Date();
    const endDate = bidding.endDate ? new Date(bidding.endDate) : null;
    const isNotExpired = !endDate || now <= endDate;

    const isInvited = bidding.suppliers?.some(
      (s) => s.supplierId === userSupplierInfo.id
    );

    return isOngoing && isNotExpired && isInvited;
  });
};

/**
 * 입찰 참여 데이터 준비
 * @param {Object} bidding - 입찰 공고 객체
 * @param {Object} participationData - 사용자 입력 참여 데이터
 * @param {Object} userSupplierInfo - 공급사 정보 객체
 * @returns {Object} API 요청용 데이터
 */
export const prepareParticipationSubmission = (
  bidding,
  participationData,
  userSupplierInfo
) => {
  const { unitPrice, quantity, note } = participationData;
  const { supplyPrice, vat, totalAmount } = calculateParticipationAmount(
    unitPrice,
    quantity
  );

  return {
    biddingId: bidding.id,
    supplierId: userSupplierInfo.id,
    companyName: userSupplierInfo.companyName,
    unitPrice,
    quantity,
    supplyPrice,
    vat,
    totalAmount,
    note: note || ""
  };
};
