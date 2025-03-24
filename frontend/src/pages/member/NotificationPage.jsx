// frontend/src/pages/NotificationPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useWebSocket from "@/hooks/useWebSocket";
import { markAsRead, deleteNotification } from "@/redux/notificationSlice";
import "/public/css/layout/Notification.css";

function NotificationPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // useWebSocket 사용 - 알림 기능만 활성화
  const websocket = useWebSocket(user, {
    enablePurchaseRequests: false,
    enableBiddings: false,
    enableNotifications: true
  });

  // Redux에서 직접 알림 데이터 가져오기
  const notifications = useSelector(
    (state) => state.notifications?.items || []
  );
  const unreadCount = useSelector(
    (state) => state.notifications?.unreadCount || 0
  );

  const [filter, setFilter] = useState("all"); // all, unread, bidding, contracts, orders
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // 필터된 알림 목록
  const filteredNotifications =
    notifications?.filter((notification) => {
      if (filter === "all") return true;
      if (filter === "unread") return !notification.isRead;
      if (filter === "bidding") return notification.type?.includes("BIDDING");
      if (filter === "contracts")
        return notification.type?.includes("CONTRACT");
      if (filter === "orders") return notification.type?.includes("ORDER");
      return true;
    }) || [];

  // 알림 선택 토글
  const toggleNotificationSelection = (id) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]
    );
  };

  // 모두 선택/해제 토글
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
    setSelectAll(!selectAll);
  };

  // 알림 읽음 처리
  const markNotificationAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  // 알림 삭제
  const removeNotification = (id) => {
    dispatch(deleteNotification(id));
  };

  // 선택된 알림 읽음 처리
  const markSelectedAsRead = () => {
    selectedNotifications.forEach((id) => {
      markNotificationAsRead(id);
    });
    setSelectedNotifications([]);
    setSelectAll(false);
  };

  // 선택된 알림 삭제
  const deleteSelected = () => {
    if (
      window.confirm(
        `선택한 ${selectedNotifications.length}개의 알림을 삭제하시겠습니까?`
      )
    ) {
      selectedNotifications.forEach((id) => {
        removeNotification(id);
      });
      setSelectedNotifications([]);
      setSelectAll(false);
    }
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
      }
    }
  };

  // 알림 아이콘 가져오기
  const getNotificationIcon = (type) => {
    if (type?.includes("BIDDING")) return "📋";
    if (type?.includes("CONTRACT")) return "📝";
    if (type?.includes("ORDER")) return "🚚";
    if (type?.includes("EVALUATION")) return "📊";
    return "🔔";
  };

  // 알림 타입 텍스트 가져오기
  const getNotificationTypeText = (type) => {
    if (type?.includes("BIDDING_INVITE")) return "입찰 초대";
    if (type?.includes("BIDDING_STATUS_CHANGE")) return "입찰 상태 변경";
    if (type?.includes("BIDDING_WINNER_SELECTED")) return "낙찰자 선정";
    if (type?.includes("CONTRACT_CREATED")) return "계약 생성";
    if (type?.includes("CONTRACT_DRAFT_READY")) return "계약 초안 준비";
    if (type?.includes("ORDER_CREATED")) return "발주 생성";
    if (type?.includes("EVALUATION")) return "평가 알림";
    return "일반 알림";
  };

  return (
    <div className="notification_page">
      <div className="notification_header">
        <h1>알림</h1>
        <div className="notification_actions">
          <div className="notification_filters">
            <button
              className={`filter_button ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}>
              전체
            </button>
            <button
              className={`filter_button ${filter === "unread" ? "active" : ""}`}
              onClick={() => setFilter("unread")}>
              읽지 않음 ({unreadCount})
            </button>
            <button
              className={`filter_button ${
                filter === "bidding" ? "active" : ""
              }`}
              onClick={() => setFilter("bidding")}>
              입찰 관련
            </button>
            <button
              className={`filter_button ${
                filter === "contracts" ? "active" : ""
              }`}
              onClick={() => setFilter("contracts")}>
              계약 관련
            </button>
            <button
              className={`filter_button ${filter === "orders" ? "active" : ""}`}
              onClick={() => setFilter("orders")}>
              발주 관련
            </button>
          </div>

          <div className="notification_bulk_actions">
            <button className="select_all_button" onClick={toggleSelectAll}>
              {selectAll ? "전체 선택 해제" : "전체 선택"}
            </button>
            <button
              className="mark_read_button"
              disabled={selectedNotifications.length === 0}
              onClick={markSelectedAsRead}>
              읽음 표시
            </button>
            <button
              className="delete_button"
              disabled={selectedNotifications.length === 0}
              onClick={deleteSelected}>
              삭제
            </button>
          </div>
        </div>
      </div>

      <div className="notification_list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification_item ${
                !notification.isRead ? "unread" : ""
              }`}>
              <div className="notification_checkbox">
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification.id)}
                  onChange={() => toggleNotificationSelection(notification.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div
                className="notification_content"
                onClick={() => handleNotificationClick(notification)}>
                <div className="notification_icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification_details">
                  <div className="notification_meta">
                    <span className="notification_type">
                      {getNotificationTypeText(notification.type)}
                    </span>
                    {/* <span className="notification_time">
                      {formatRelativeTime(notification.createdAt)}
                    </span> */}
                  </div>
                  <h3 className="notification_title">{notification.title}</h3>
                  <p className="notification_message">{notification.content}</p>
                </div>
                {!notification.isRead && (
                  <div className="notification_status">
                    <span className="unread_badge">읽지 않음</span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no_notifications">
            <p>표시할 알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPage;
