// frontend/src/utils/bidding/notificationHelpers.js
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";

/**
 * 입찰 알림 유형
 */
export const BIDDING_NOTIFICATION_TYPES = {
  BIDDING_INVITE: "BIDDING_INVITE",
  BIDDING_STATUS_CHANGE: "BIDDING_STATUS_CHANGE",
  BIDDING_WINNER_SELECTED: "BIDDING_WINNER_SELECTED",
  CONTRACT_CREATED: "CONTRACT_CREATED",
  CONTRACT_DRAFT_READY: "CONTRACT_DRAFT_READY",
  ORDER_CREATED: "ORDER_CREATED",
  PURCHASE_REQUEST_STATUS: "PURCHASE_REQUEST_STATUS",
  EVALUATION_REQUEST: "EVALUATION_REQUEST"
};

/**
 * 구매자/관리자에게 입찰 상태 변경 알림 발송
 * @param {number} biddingId - 입찰 ID
 * @param {string} statusCode - 상태 코드
 * @param {string} title - 알림 제목
 * @param {string} content - 알림 내용
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendBiddingStatusNotificationToBuyer(
  biddingId,
  statusCode,
  title,
  content
) {
  try {
    const response = await fetchWithAuth(`${API_URL}notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: BIDDING_NOTIFICATION_TYPES.BIDDING_STATUS_CHANGE,
        referenceId: biddingId,
        title: title || `입찰 상태 변경`,
        content: content || `입찰 공고 상태가 ${statusCode}로 변경되었습니다.`,
        recipientType: "BUYER",
        priority: "NORMAL"
      })
    });

    return response;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 공급자에게 입찰 상태 변경 알림 발송
 * @param {number} biddingId - 입찰 ID
 * @param {Array<number>} supplierIds - 공급자 ID 배열
 * @param {string} statusCode - 상태 코드
 * @param {string} title - 알림 제목
 * @param {string} content - 알림 내용
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendBiddingStatusNotificationToSuppliers(
  biddingId,
  supplierIds,
  statusCode,
  title,
  content
) {
  try {
    const response = await fetchWithAuth(`${API_URL}notifications/send-bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: BIDDING_NOTIFICATION_TYPES.BIDDING_STATUS_CHANGE,
        referenceId: biddingId,
        title: title || `입찰 상태 변경`,
        content: content || `입찰 공고 상태가 ${statusCode}로 변경되었습니다.`,
        recipientIds: supplierIds,
        priority: "NORMAL"
      })
    });

    return response;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 낙찰자 선정 알림 발송
 * @param {number} biddingId - 입찰 ID
 * @param {number} winnerId - 낙찰자 ID
 * @param {Array<number>} otherParticipantIds - 다른 참가자 ID 배열
 * @param {string} title - 알림 제목
 * @param {string} content - 알림 내용
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendBidderSelectionNotification(
  biddingId,
  winnerId,
  otherParticipantIds,
  title,
  content
) {
  try {
    // 낙찰자에게 알림
    const winnerResponse = await fetchWithAuth(`${API_URL}notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: BIDDING_NOTIFICATION_TYPES.BIDDING_WINNER_SELECTED,
        referenceId: biddingId,
        title: title || `낙찰자 선정 완료`,
        content:
          content ||
          `귀사가 입찰 공고의 낙찰자로 선정되었습니다. 계약 절차가 곧 진행될 예정입니다.`,
        recipientId: winnerId,
        priority: "HIGH"
      })
    });

    // 다른 참가자들에게 알림
    if (otherParticipantIds && otherParticipantIds.length > 0) {
      await fetchWithAuth(`${API_URL}notifications/send-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: BIDDING_NOTIFICATION_TYPES.BIDDING_WINNER_SELECTED,
          referenceId: biddingId,
          title: `낙찰자 선정 완료`,
          content: `입찰 공고의 낙찰자가 선정되었습니다.`,
          recipientIds: otherParticipantIds,
          priority: "NORMAL"
        })
      });
    }

    // 구매자(생성자)에게 알림
    await sendBiddingStatusNotificationToBuyer(
      biddingId,
      "SELECTED",
      "낙찰자 선정 완료",
      "입찰 공고의 낙찰자가 선정되었습니다. 계약 초안 생성을 진행해주세요."
    );

    return winnerResponse;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 계약 초안 생성 알림 발송
 * @param {number} contractId - 계약 ID
 * @param {number} biddingId - 입찰 ID
 * @param {number} supplierId - 공급자 ID
 * @param {number} buyerId - 구매자 ID
 * @param {string} title - 알림 제목
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendContractDraftNotification(
  contractId,
  biddingId,
  supplierId,
  buyerId,
  title
) {
  try {
    // 공급사에게 알림
    const supplierResponse = await fetchWithAuth(
      `${API_URL}notifications/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: BIDDING_NOTIFICATION_TYPES.CONTRACT_DRAFT_READY,
          referenceId: contractId,
          title: title || `계약 초안 생성`,
          content: `입찰 공고에 대한 계약 초안이 생성되었습니다. 계약 목록에서 확인해주세요.`,
          recipientId: supplierId,
          priority: "NORMAL"
        })
      }
    );

    // 구매자에게 알림
    if (buyerId) {
      await fetchWithAuth(`${API_URL}notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: BIDDING_NOTIFICATION_TYPES.CONTRACT_DRAFT_READY,
          referenceId: contractId,
          title: `계약 초안 생성 완료`,
          content: `입찰 공고에 대한 계약 초안이 생성되었습니다. 계약 목록 페이지에서 세부 정보를 입력해주세요.`,
          recipientId: buyerId,
          priority: "HIGH"
        })
      });
    }

    return supplierResponse;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 발주 생성 알림 발송
 * @param {number} orderId - 발주 ID
 * @param {number} supplierId - 공급자 ID
 * @param {number} buyerId - 구매자 ID
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendOrderCreationNotification(
  orderId,
  supplierId,
  buyerId
) {
  try {
    // 공급사에게 알림
    const supplierResponse = await fetchWithAuth(
      `${API_URL}notifications/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: BIDDING_NOTIFICATION_TYPES.ORDER_CREATED,
          referenceId: orderId,
          title: `발주서 생성`,
          content: `발주서가 생성되었습니다. 확인해주세요.`,
          recipientId: supplierId,
          priority: "HIGH"
        })
      }
    );

    // 구매자에게 알림
    if (buyerId) {
      await fetchWithAuth(`${API_URL}notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: BIDDING_NOTIFICATION_TYPES.ORDER_CREATED,
          referenceId: orderId,
          title: `발주서 생성 완료`,
          content: `발주서가 성공적으로 생성되었습니다.`,
          recipientId: buyerId,
          priority: "NORMAL"
        })
      });
    }

    return supplierResponse;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 구매 요청 상태 변경 알림 발송
 * @param {number} prId - 구매 요청 ID
 * @param {number} requesterId - 요청자 ID
 * @param {string} status - 상태 코드
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendPurchaseRequestStatusNotification(
  prId,
  requesterId,
  status
) {
  try {
    let title = "구매 요청 상태 변경";
    let content = "구매 요청 상태가 변경되었습니다.";

    if (status === "APPROVED") {
      title = "구매 요청 승인";
      content = "귀하의 구매 요청이 승인되었습니다.";
    } else if (status === "REJECTED") {
      title = "구매 요청 거부";
      content = "귀하의 구매 요청이 거부되었습니다. 상세 내용을 확인해주세요.";
    } else if (status === "PENDING") {
      title = "구매 요청 대기";
      content = "귀하의 구매 요청이 검토 대기 중입니다.";
    }

    const response = await fetchWithAuth(`${API_URL}notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: BIDDING_NOTIFICATION_TYPES.PURCHASE_REQUEST_STATUS,
        referenceId: prId,
        title,
        content,
        recipientId: requesterId,
        priority:
          status === "APPROVED" || status === "REJECTED" ? "HIGH" : "NORMAL"
      })
    });

    return response;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}

/**
 * 평가 요청 알림 발송
 * @param {number} evaluationId - 평가 ID
 * @param {number} biddingId - 입찰 ID
 * @param {number} supplierId - 공급자 ID
 * @returns {Promise<Response>} 응답 객체
 */
export async function sendEvaluationRequestNotification(
  evaluationId,
  biddingId,
  supplierId
) {
  try {
    const response = await fetchWithAuth(`${API_URL}notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: BIDDING_NOTIFICATION_TYPES.EVALUATION_REQUEST,
        referenceId: evaluationId,
        title: `입찰 평가 시작`,
        content: `입찰 공고에 대한 평가가 시작되었습니다.`,
        recipientId: supplierId,
        priority: "NORMAL"
      })
    });

    return response;
  } catch (error) {
    console.error("알림 발송 중 오류 발생:", error);
    throw error;
  }
}
