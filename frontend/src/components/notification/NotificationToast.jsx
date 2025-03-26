// frontend/src/components/notification/NotificationToast.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import useWebSocket from "@/hooks/useWebSocket";
import "/public/css/layout/Notification.css";

function NotificationToast() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // WebSocket 훅에서 토스트 알림 관련 기능만 사용
  const { toast, closeToast } = useWebSocket(user, {
    enablePurchaseRequests: false,
    enableBiddings: false,
    enableNotifications: true
  });

  // 토스트가 없으면 렌더링하지 않음
  if (!toast) return null;

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return "📋";
    if (type?.includes("CONTRACT")) return "📝";
    if (type?.includes("ORDER")) return "🚚";
    if (type?.includes("EVALUATION")) return "📊";
    return "🔔";
  };

  // 알림 클릭 핸들러
  const handleToastClick = () => {
    // 참조 ID가 있으면 해당 페이지로 이동
    if (toast.referenceId) {
      const type = toast.type || "";

      if (type.includes("BIDDING")) {
        navigate(`/biddings/${toast.referenceId}`);
      } else if (type.includes("CONTRACT")) {
        navigate(`/contracts/${toast.referenceId}`);
      } else if (type.includes("ORDER")) {
        navigate(`/orders/${toast.referenceId}`);
      } else if (type.includes("EVALUATION")) {
        navigate(`/evaluations/${toast.referenceId}`);
      } else {
        navigate("/notifications");
      }
    } else {
      navigate("/notifications");
    }

    // 토스트 닫기
    closeToast();
  };

  return (
    <div className="notification_toast_container">
      <div className="notification_toast" onClick={handleToastClick}>
        <div className="notification_toast_icon">
          {getNotificationIcon(toast.type)}
        </div>
        <div className="notification_toast_content">
          <div className="notification_toast_header">
            <div className="notification_toast_title">{toast.title}</div>
            <button
              className="notification_toast_close"
              onClick={(e) => {
                e.stopPropagation();
                closeToast();
              }}>
              ×
            </button>
          </div>
          <div className="notification_toast_message">{toast.content}</div>
          {/* <div className="notification_toast_time">
            {formatRelativeTime(toast.createdAt)}
          </div> */}
        </div>
      </div>
    </div>
  );
}

export default NotificationToast;
