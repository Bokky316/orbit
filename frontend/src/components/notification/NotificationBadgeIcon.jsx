// frontend/src/components/notification/NotificationBadgeIcon.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "/public/css/layout/Notification.css";

function NotificationBadgeIcon() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // 임시 데이터로 대체 (API 연결 문제 해결 전까지)
  const notifications = [];
  const unreadCount = 0;
  const markNotificationAsRead = () => {};

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 알림 토글
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    // 알림 읽음 처리
    markNotificationAsRead(notification.id);

    // 알림 타입에 따라 적절한 페이지로 이동
    if (notification.referenceId) {
      if (notification.type?.includes("BIDDING")) {
        navigate(`/biddings/${notification.referenceId}`);
      } else if (notification.type?.includes("CONTRACT")) {
        navigate(`/contracts/${notification.referenceId}`);
      } else if (notification.type?.includes("ORDER")) {
        navigate(`/orders/${notification.referenceId}`);
      } else {
        navigate(`/notifications`);
      }
    } else {
      navigate("/notifications");
    }

    // 드롭다운 닫기
    setIsDropdownOpen(false);
  };

  // 모든 알림 보기 클릭 핸들러
  const handleViewAllNotifications = () => {
    navigate("/notifications");
    setIsDropdownOpen(false);
  };

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="notification_wrapper" ref={dropdownRef}>
      <div className="notification_icon" onClick={toggleDropdown}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
            fill="currentColor"
          />
          {unreadCount > 0 && <circle cx="18" cy="6" r="6" fill="#F44336" />}
        </svg>
        {unreadCount > 0 && (
          <span className="notification_badge">
            {Math.min(unreadCount, 99)}
          </span>
        )}
      </div>

      {isDropdownOpen && (
        <div className="notification_dropdown">
          <div className="notification_header">
            <h3>알림</h3>
            <span className="unread_count">
              {unreadCount}개의 읽지 않은 알림
            </span>
          </div>

          <div className="notification_list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification_item ${
                    !notification.isRead ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}>
                  <div className="notification_icon_type">
                    {notification.type?.includes("BIDDING") && "📋"}
                    {notification.type?.includes("CONTRACT") && "📝"}
                    {notification.type?.includes("ORDER") && "🚚"}
                    {notification.type?.includes("EVALUATION") && "📊"}
                    {(!notification.type ||
                      !notification.type.match(
                        /(BIDDING|CONTRACT|ORDER|EVALUATION)/
                      )) &&
                      "🔔"}
                  </div>
                  <div className="notification_content">
                    <div className="notification_title">
                      {notification.title}
                    </div>
                    <div className="notification_message">
                      {notification.content}
                    </div>
                    {/* <div className="notification_time">
                      {formatRelativeTime(notification.createdAt)}
                    </div> */}
                  </div>
                  {!notification.isRead && (
                    <div className="notification_unread_marker"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="notification_empty">알림이 없습니다</div>
            )}
          </div>

          <div className="notification_footer">
            <button
              onClick={handleViewAllNotifications}
              className="view_all_button">
              모든 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBadgeIcon;
