import { BiddingStatus, UserRole, BiddingMethod } from "./biddingTypes";
import { getStatusText, getBidMethodText } from "./commonBiddingHelpers";

export const canManageBidding = (mode, bidding, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  if (mode === "create") return true;

  const editableStatuses = [BiddingStatus.PENDING, BiddingStatus.ONGOING];
  return editableStatuses.includes(bidding?.status?.childCode);
};

export const canChangeBiddingStatus = (currentStatus, newStatus, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  const statusTransitionMap = {
    [BiddingStatus.PENDING]: [BiddingStatus.ONGOING, BiddingStatus.CANCELED],
    [BiddingStatus.ONGOING]: [BiddingStatus.CLOSED, BiddingStatus.CANCELED],
    [BiddingStatus.CLOSED]: [],
    [BiddingStatus.CANCELED]: []
  };

  return statusTransitionMap[currentStatus]?.includes(newStatus) || false;
};

export const validateBiddingForm = (formData, mode) => {
  const errors = {};

  if (!formData.purchaseRequestCode) {
    errors.purchaseRequestCode = "구매 요청을 선택해주세요.";
  }

  if (
    mode === "create" &&
    (!formData.suppliers || formData.suppliers.length === 0)
  ) {
    errors.suppliers = "최소 한 개의 공급사를 선택해주세요.";
  }

  if (!formData.deadline) {
    errors.deadline = "마감일을 선택해주세요.";
  }

  if (formData.bidMethod === BiddingMethod.FIXED_PRICE) {
    if (!formData.itemQuantity || formData.itemQuantity <= 0) {
      errors.itemQuantity = "수량을 올바르게 입력해주세요.";
    }

    if (!formData.unitPrice || formData.unitPrice <= 0) {
      errors.unitPrice = "단가를 올바르게 입력해주세요.";
    }
  }

  if (formData.files) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    formData.files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.files = `파일 크기는 50MB를 초과할 수 없습니다: ${file.name}`;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.files = `지원되지 않는 파일 형식입니다: ${file.name}`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const canSelectWinner = (bidding, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  const isClosedStatus = bidding.status?.childCode === BiddingStatus.CLOSED;
  const hasParticipations =
    bidding.participations && bidding.participations.length > 0;

  return isClosedStatus && hasParticipations;
};

export const canCreateContractDraft = (bidding, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  const hasClosedStatus = bidding.status?.childCode === BiddingStatus.CLOSED;
  const hasSelectedBidder = !!bidding.selectedParticipationId;
  const noExistingContracts =
    !bidding.contracts || bidding.contracts.length === 0;

  return hasClosedStatus && hasSelectedBidder && noExistingContracts;
};

export const canCreateOrder = (bidding, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  const hasClosedStatus = bidding.status?.childCode === BiddingStatus.CLOSED;
  const hasSelectedBidder = !!bidding.selectedParticipationId;
  const noExistingOrders = !bidding.orders || bidding.orders.length === 0;

  return hasClosedStatus && hasSelectedBidder && noExistingOrders;
};

export const canEvaluateParticipation = (bidding, userRole) => {
  const allowedRoles = [UserRole.ADMIN, UserRole.BUYER];
  if (!allowedRoles.includes(userRole)) return false;

  const validStatuses = [BiddingStatus.ONGOING, BiddingStatus.CLOSED];
  const hasValidStatus = validStatuses.includes(bidding.status?.childCode);
  const hasParticipations =
    bidding.participations && bidding.participations.length > 0;

  return hasValidStatus && hasParticipations;
};

export const getBiddingProcessSummary = (bidding) => {
  if (!bidding) return null;

  return {
    id: bidding.id,
    bidNumber: bidding.bidNumber,
    title: bidding.title,
    status: bidding.status?.childCode || BiddingStatus.PENDING,
    method: bidding.bidMethod || BiddingMethod.FIXED_PRICE,
    steps: {
      created: true,
      ongoing: [BiddingStatus.ONGOING, BiddingStatus.CLOSED].includes(
        bidding.status?.childCode
      ),
      closed: bidding.status?.childCode === BiddingStatus.CLOSED,
      evaluated: isAllParticipationsEvaluated(bidding),
      bidderSelected: !!bidding.selectedParticipationId,
      contractCreated: bidding.contracts && bidding.contracts.length > 0,
      orderCreated: bidding.orders && bidding.orders.length > 0
    },
    participationCount: bidding.participations?.length || 0,
    evaluatedCount:
      bidding.participations?.filter((p) => p.isEvaluated).length || 0,
    selectedBidder: getSelectedBidder(bidding)
  };
};

const isAllParticipationsEvaluated = (bidding) => {
  return bidding.participations
    ? bidding.participations.every((p) => p.isEvaluated)
    : false;
};

const getSelectedBidder = (bidding) => {
  const selectedBidder = bidding.participations?.find(
    (p) => p.isSelectedBidder
  );
  return selectedBidder
    ? {
        id: selectedBidder.id,
        supplierId: selectedBidder.supplierId,
        name: selectedBidder.companyName,
        totalAmount: selectedBidder.totalAmount
      }
    : null;
};
