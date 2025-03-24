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
  const fieldsToFocus = [];

  // 구매 요청 ID 검증
  const purchaseRequestId = parseInt(formData.purchaseRequestId, 10);
  if (isNaN(purchaseRequestId) || purchaseRequestId <= 0) {
    errors.requestNumber = "유효한 구매 요청을 선택해주세요.";
    fieldsToFocus.push("requestNumber");
  }

  // 구매 요청 품목 ID 검증
  const purchaseRequestItemId = parseInt(formData.purchaseRequestItemId, 10);
  if (isNaN(purchaseRequestItemId) || purchaseRequestItemId <= 0) {
    errors.purchaseRequestItemId = "유효한 품목을 선택해주세요.";
    // 구매 요청 선택 시 함께 처리되므로 별도 포커스는 필요 없음
  }

  // 제목 검증 - title이 없으면 requestName을 사용할 수 있음
  if (!formData.title && !formData.requestName) {
    errors.title = "제목이 필요합니다.";
    fieldsToFocus.push("title");
  }

  // 공급사 검증
  if (
    mode === "create" &&
    (!formData.suppliers || formData.suppliers.length === 0)
  ) {
    errors.suppliers = "최소 한 개의 공급사를 선택해주세요.";
    fieldsToFocus.push("suppliers");
  }

  // 마감일 검증
  if (!formData.deadline) {
    errors.deadline = "마감일을 선택해주세요.";
    fieldsToFocus.push("deadline");
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate < today) {
      errors.deadline = "입찰 마감일은 오늘 이후여야 합니다.";
      fieldsToFocus.push("deadline");
    }
  }

  // 상태 검증
  if (!formData.status || !formData.status.childCode) {
    errors.status = "입찰 상태를 선택해주세요.";
    fieldsToFocus.push("status");
  }

  // 입찰 방식 검증
  if (!formData.bidMethod) {
    errors.bidMethod = "입찰 방식을 선택해주세요.";
    fieldsToFocus.push("bidMethod");
  }

  // 수량 및 단가 검증 (고정가격 입찰 방식에서만)
  if (formData.bidMethod === BiddingMethod.FIXED_PRICE) {
    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      errors.quantity = "수량을 올바르게 입력해주세요.";
      fieldsToFocus.push("quantity");
    }

    const unitPrice = parseFloat(formData.unitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      errors.unitPrice = "단가를 올바르게 입력해주세요.";
      fieldsToFocus.push("unitPrice");
    }
  }

  // 입찰 조건 검증
  if (!formData.biddingConditions || formData.biddingConditions.trim() === "") {
    errors.biddingConditions = "입찰 조건을 입력해주세요.";
    fieldsToFocus.push("biddingConditions");
  }

  // 파일 검증
  if (formData.files && formData.files.length > 0) {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    for (const file of formData.files) {
      // File 객체인 경우에만 검증
      if (file instanceof File) {
        if (file.size > MAX_FILE_SIZE) {
          errors.files = `파일 크기는 50MB를 초과할 수 없습니다: ${file.name}`;
          fieldsToFocus.push("files");
          break;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.files = `지원되지 않는 파일 형식입니다: ${file.name}`;
          fieldsToFocus.push("files");
          break;
        }
      }
    }
  }

  // 유효성 검사 결과 반환
  const isValid = Object.keys(errors).length === 0;

  // 에러가 있는 경우 첫 번째 에러 필드로 스크롤
  if (!isValid && fieldsToFocus.length > 0) {
    setTimeout(() => {
      const firstErrorField = document.querySelector(
        `[name="${fieldsToFocus[0]}"]`
      );
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
        try {
          firstErrorField.focus();
        } catch (e) {
          console.log("포커스 설정 중 오류 발생:", e);
        }
      }
    }, 100);
  }

  return {
    isValid,
    errors,
    fieldsToFocus
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
