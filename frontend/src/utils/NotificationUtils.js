// frontend/src/utils/NotificationUtils.js

/**
 * 알림 타입에 따른 아이콘, 색상, 제목 등의 스타일 정보를 반환하는 함수
 * @param {string} type 알림 타입
 * @returns {Object} 스타일 정보 객체
 */
export const getNotificationStyle = (type) => {
  let icon = "🔔";
  let color = "#757575"; // 기본 회색
  let title = "알림";

  if (!type) return { icon, color, title };

  if (type.includes("BIDDING")) {
    icon = "📋";
    color = "#2196F3"; // 파란색
    title = "입찰 알림";
  } else if (type.includes("CONTRACT")) {
    icon = "📝";
    color = "#4CAF50"; // 녹색
    title = "계약 알림";
  } else if (type.includes("ORDER")) {
    icon = "🚚";
    color = "#FF9800"; // 주황색
    title = "발주 알림";
  } else if (type.includes("PURCHASE_REQUEST")) {
    icon = "📑";
    color = "#9C27B0"; // 보라색
    title = "구매요청 알림";
  } else if (type.includes("EVALUATION")) {
    icon = "📊";
    color = "#795548"; // 갈색
    title = "평가 알림";
  } else if (type.includes("SYSTEM")) {
    icon = "⚙️";
    color = "#607D8B"; // 파란 회색
    title = "시스템 알림";
  }

  return { icon, color, title };
};

/**
 * 상대 시간 포맷팅 함수
 * @param {string} dateString 날짜 문자열 또는 Date 객체
 * @returns {string} 상대 시간 문자열
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "날짜 없음";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "유효하지 않은 날짜";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  // 1분 미만
  if (diffInSeconds < 60) {
    return "방금 전";
  }

  // 1시간 미만
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  // 1일 미만
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 1주일 미만
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  }

  // 30일 미만
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}주 전`;
  }

  // 1년 미만
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }

  // 1년 이상
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

/**
 * 알림 내용을 정리하여 표시할 텍스트를 생성하는 함수
 * @param {Object} notification 알림 객체
 * @returns {string} 정리된 알림 텍스트
 */
export const getNotificationText = (notification) => {
  if (!notification) return "";

  if (notification.content) {
    return notification.content;
  }

  // content가 없는 경우 타입에 따라 기본 메시지 생성
  const { type } = notification;

  if (type?.includes("BIDDING_CREATED")) {
    return "새로운 입찰 공고가 등록되었습니다.";
  } else if (type?.includes("BIDDING_UPDATED")) {
    return "입찰 공고가 수정되었습니다.";
  } else if (type?.includes("BIDDING_STATUS_CHANGED")) {
    return "입찰 공고 상태가 변경되었습니다.";
  } else if (type?.includes("CONTRACT_CREATED")) {
    return "새로운 계약이 생성되었습니다.";
  } else if (type?.includes("ORDER_CREATED")) {
    return "새로운 발주가 생성되었습니다.";
  } else if (type?.includes("PURCHASE_REQUEST_CREATED")) {
    return "새로운 구매 요청이 생성되었습니다.";
  }

  return "새로운 알림이 있습니다.";
};

/**
 * 알림 오브젝트 목록을 그룹화하는 함수
 * @param {Array} notifications 알림 목록
 * @returns {Array} 날짜별로 그룹화된 알림 목록
 */
export const groupNotificationsByDate = (notifications) => {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  const groups = {};

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt || notification.timestamp);
    const dateString = date.toLocaleDateString();

    if (!groups[dateString]) {
      groups[dateString] = [];
    }

    groups[dateString].push(notification);
  });

  // 그룹화된 결과를 날짜별 배열로 변환
  return Object.keys(groups)
    .map((dateString) => ({
      date: dateString,
      items: groups[dateString]
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 날짜순으로 정렬
};
