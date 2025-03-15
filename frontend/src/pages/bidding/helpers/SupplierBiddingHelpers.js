import { BiddingStatus, UserRole, BiddingMethod } from "./biddingTypes";

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

const hasAlreadyParticipated = (bidding, userSupplierInfo) => {
  return (
    bidding.participations?.some((p) => p.supplierId === userSupplierInfo.id) ??
    false
  );
};

const checkMethodParticipation = (bidding, userSupplierInfo) => {
  return bidding.bidMethod === BiddingMethod.FIXED_PRICE
    ? bidding.suppliers?.some((s) => s.supplierId === userSupplierInfo.id)
    : true;
};

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

export const filterParticipableBiddings = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) =>
    canParticipateInBidding(bidding, UserRole.SUPPLIER, userSupplierInfo)
  );
};

export const filterMyParticipations = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) =>
    bidding.participations?.some((p) => p.supplierId === userSupplierInfo.id)
  );
};

export const filterInvitedBiddings = (biddings, userSupplierInfo) => {
  if (!biddings || !userSupplierInfo) return [];

  return biddings.filter((bidding) => {
    const isOngoing = bidding.status?.childCode === BiddingStatus.ONGOING;
    const now = new Date();
    const endDate = bidding.endDate ? new Date(bidding.endDate) : null;
    const isNotExpired = !endDate || now <= endDate;

    const isInvitedForFixed =
      bidding.bidMethod === BiddingMethod.FIXED_PRICE &&
      bidding.suppliers?.some((s) => s.supplierId === userSupplierInfo.id);

    return isOngoing && isNotExpired && isInvitedForFixed;
  });
};

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
