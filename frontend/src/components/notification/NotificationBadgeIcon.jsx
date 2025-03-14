import React, { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";

function NotificationBadgeIcon() {
  const { notifications, unreadCount } = useNotifications();
  const [displayCount, setDisplayCount] = useState(0);

  // 최대 99개까지 표시
  useEffect(() => {
    setDisplayCount(Math.min(unreadCount, 99));
  }, [unreadCount]);

  // 알림 목록 토글
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (
    <div className="notification_container" onClick={toggleNotifications}>
      <svg
        width="26"
        height="28"
        viewBox="0 0 26 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.45264 25.6682C10.0608 27.0357 11.4092 28 13.0008 28C14.5923 28 15.9408 27.0357 16.549 25.6682C15.4267 25.7231 14.2597 25.76 13.0008 25.76C11.7419 25.76 10.5749 25.7231 9.45264 25.6682Z"
          fill="black"
        />
        <path
          d="M25.3532 19.74C23.877 17.8785 21.3996 14.2195 21.3996 10.64C21.3996 7.09073 19.1193 3.89758 15.7996 2.72382C15.7593 1.21406 14.5183 0 13.0007 0C11.482 0 10.2422 1.21406 10.2018 2.72382C6.88101 3.89758 4.6007 7.09073 4.6007 10.64C4.6007 14.2207 2.1244 17.8785 0.647123 19.74C0.154334 20.3616 0.00197428 21.1825 0.240576 21.9363C0.473545 22.6721 1.05367 23.2422 1.79288 23.4595C3.08761 23.8415 5.20997 24.2715 8.44682 24.491C9.84791 24.5851 11.3543 24.64 13.0008 24.64C14.646 24.64 16.1525 24.5851 17.5535 24.491C20.7915 24.2715 22.9128 23.8415 24.2086 23.4595C24.9478 23.2422 25.5268 22.6722 25.7598 21.9363C25.9983 21.1825 25.8449 20.3616 25.3532 19.74Z"
          fill="black"
        />
      </svg>

      {displayCount > 0 && (
        <div className="notification_badge">{displayCount}</div>
      )}

      {/* 알림 드롭다운 */}
      {isNotificationOpen && (
        <div className="notification_dropdown">
          <div className="notification_header">
            <h3>알림</h3>
            <span>총 {displayCount}개의 새 알림</span>
          </div>
          <ul className="notification_list">
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className="notification_item">
                <div className="notification_content">
                  <h4>{notification.title}</h4>
                  <p>{notification.content}</p>
                  <small>
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          {/* <div className="notification_footer">
            <button onClick={() => navigate("/notifications")}>
              모든 알림 보기
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
}

export default NotificationBadgeIcon;
