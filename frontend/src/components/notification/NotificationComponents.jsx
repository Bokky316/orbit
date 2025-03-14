import React from "react";
import {
  useNotifications,
  useWebSocketNotifications,
  useNotificationInteractions
} from "@/hooks/useNotifications";
import {
  NOTIFICATION_TYPES,
  getNotificationStyle
} from "@/utils/notificationTypes";

// 알림 패널 컴포넌트
function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    deleteNotification
  } = useNotifications();

  const { handleNotificationClick } =
    useNotificationInteractions(notifications);

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>알림</h3>
        <span className="unread-count">{unreadCount}</span>
      </div>

      <div className="notification-list">
        {notifications.map((notification) => {
          const { icon, color, title } = getNotificationStyle(
            notification.type
          );

          return (
            <div
              key={notification.id}
              className={`notification-item ${
                notification.isRead ? "read" : "unread"
              }`}
              onClick={() => handleNotificationClick(notification)}>
              <div className="notification-icon">{icon}</div>
              <div className="notification-content">
                <div className="notification-title">{title}</div>
                <div className="notification-message">
                  {notification.content}
                </div>
                <div className="notification-time">
                  {formatRelativeTime(notification.createdAt)}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(notification.id);
                    }}>
                    읽음
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}>
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 실시간 알림 토스트 컴포넌트
function NotificationToast() {
  const { notifications } = useWebSocketNotifications();
  const { handleNotificationClick } =
    useNotificationInteractions(notifications);

  // 가장 최근 알림만 표시
  const latestNotification = notifications[0];

  if (!latestNotification) return null;

  const { icon, color, title } = getNotificationStyle(latestNotification.type);

  return (
    <div
      className="notification-toast"
      onClick={() => handleNotificationClick(latestNotification)}>
      <div className="notification-toast-icon">{icon}</div>
      <div className="notification-toast-content">
        <div className="notification-toast-title">{title}</div>
        <div className="notification-toast-message">
          {latestNotification.content}
        </div>
      </div>
    </div>
  );
}

// 상대 시간 포맷팅 유틸리티 함수
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return "방금 전";
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}시간 전`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}일 전`;

  return date.toLocaleDateString();
}

export { NotificationPanel, NotificationToast, formatRelativeTime };
