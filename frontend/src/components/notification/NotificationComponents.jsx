//frontend/src/components/notification/NotificationComponents.jsx

import React from "react";
import useWebSocket from "@/hooks/useWebSocket";

// 알림 패널 컴포넌트
function NotificationPanel() {
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    removeNotification,
    handleNotificationClick
  } = useNotifications();

  return (
    <div className="notification_panel">
      <div className="notification_header">
        <h3>알림</h3>
        <span className="unread_count">{unreadCount}</span>
      </div>

      <div className="notification_list">
        {notifications.map((notification) => {
          const { icon, color, title } = getNotificationStyle(
            notification.type
          );

          return (
            <div
              key={notification.id}
              className={`notification_item ${
                notification.isRead ? "read" : "unread"
              }`}
              onClick={() => handleNotificationClick(notification)}>
              <div className="notification_icon">{icon}</div>
              <div className="notification_content">
                <div className="notification_title">{title}</div>
                <div className="notification_message">
                  {notification.content}
                </div>
                {/* <div className="notification_time">
                  {formatRelativeTime(notification.createdAt)}
                </div> */}
              </div>
              <div className="notification_actions">
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
                    removeNotification(notification.id); // 이름 수정
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
  const { toast, closeToast } = useToastNotifications(); // 올바른 훅 사용
  const { handleNotificationClick } = useNotifications(); // 직접 가져오기

  if (!toast) return null;

  const { icon, color, title } = getNotificationStyle(toast.type);

  return (
    <div
      className="notification_toast"
      onClick={() => handleNotificationClick(toast)}>
      <div className="notification_toast_icon">{icon}</div>
      <div className="notification_toast_content">
        <div className="notification_toast_title">{title}</div>
        <div className="notification_toast_message">{toast.content}</div>
      </div>
      <button
        className="notification_toast_close"
        onClick={(e) => {
          e.stopPropagation();
          closeToast();
        }}>
        ×
      </button>
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
