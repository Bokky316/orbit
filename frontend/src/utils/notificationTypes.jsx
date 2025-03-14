// 알림 타입 정의
export const NOTIFICATION_TYPES = {
  // 입찰 관련 알림
  BIDDING_INVITE: "BIDDING_INVITE",
  BIDDING_STATUS_CHANGE: "BIDDING_STATUS_CHANGE",
  BIDDING_WINNER_SELECTED: "BIDDING_WINNER_SELECTED",

  // 평가 관련 알림
  EVALUATION_REQUEST: "EVALUATION_REQUEST",
  EVALUATION_COMPLETED: "EVALUATION_COMPLETED",

  // 계약 관련 알림
  CONTRACT_CREATED: "CONTRACT_CREATED",
  CONTRACT_DRAFT_READY: "CONTRACT_DRAFT_READY",
  CONTRACT_INITIATED: "CONTRACT_INITIATED",

  // 발주 관련 알림
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",

  // 기본 알림
  GENERAL_NOTIFICATION: "GENERAL_NOTIFICATION"
};

// 알림 타입별 스타일 및 아이콘 매핑
export const getNotificationStyle = (type) => {
  const notificationStyles = {
    [NOTIFICATION_TYPES.BIDDING_INVITE]: {
      icon: "📋",
      color: "primary",
      title: "입찰 초대"
    },
    [NOTIFICATION_TYPES.BIDDING_STATUS_CHANGE]: {
      icon: "🔄",
      color: "secondary",
      title: "입찰 상태 변경"
    },
    [NOTIFICATION_TYPES.BIDDING_WINNER_SELECTED]: {
      icon: "🏆",
      color: "success",
      title: "낙찰자 선정"
    },
    [NOTIFICATION_TYPES.EVALUATION_REQUEST]: {
      icon: "📊",
      color: "info",
      title: "평가 요청"
    },
    [NOTIFICATION_TYPES.CONTRACT_DRAFT_READY]: {
      icon: "📝",
      color: "warning",
      title: "계약 초안 준비"
    },
    [NOTIFICATION_TYPES.ORDER_CREATED]: {
      icon: "🚚",
      color: "success",
      title: "발주 생성"
    },
    [NOTIFICATION_TYPES.GENERAL_NOTIFICATION]: {
      icon: "🔔",
      color: "default",
      title: "일반 알림"
    }
  };

  return (
    notificationStyles[type] ||
    notificationStyles[NOTIFICATION_TYPES.GENERAL_NOTIFICATION]
  );
};

// 알림 상세 페이지로 이동하는 라우팅 헬퍼
export const navigateToNotificationSource = (notification) => {
  switch (notification.type) {
    case NOTIFICATION_TYPES.BIDDING_INVITE:
    case NOTIFICATION_TYPES.BIDDING_STATUS_CHANGE:
    case NOTIFICATION_TYPES.BIDDING_WINNER_SELECTED:
      return `/biddings/${notification.referenceId}`;

    case NOTIFICATION_TYPES.CONTRACT_DRAFT_READY:
      return `/contracts/${notification.referenceId}`;

    case NOTIFICATION_TYPES.ORDER_CREATED:
      return `/orders/${notification.referenceId}`;

    case NOTIFICATION_TYPES.EVALUATION_REQUEST:
      return `/evaluations/${notification.referenceId}`;

    default:
      return "/notifications";
  }
};
