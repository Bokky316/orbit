import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { API_URL } from "@/utils/constants";
import {
  NOTIFICATION_TYPES,
  getNotificationStyle,
  navigateToNotificationSource
} from "@/utils/notificationTypes";

// 알림 관리 훅
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 알림 목록 불러오기
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`${API_URL}/notifications`);
      if (!response.ok) {
        throw new Error("알림을 불러오는 데 실패했습니다.");
      }
      const data = await response.json();

      // 알림 데이터 처리
      setNotifications(data);

      // 읽지 않은 알림 개수 계산
      const unread = data.filter((noti) => !noti.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(err);
      console.error("알림 불러오기 오류:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 알림 읽음 처리
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/notifications/${notificationId}/read`,
        {
          method: "PUT"
        }
      );

      if (!response.ok) {
        throw new Error("알림 읽음 처리에 실패했습니다.");
      }

      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.map((noti) =>
          noti.id === notificationId ? { ...noti, isRead: true } : noti
        )
      );

      // 읽지 않은 알림 개수 갱신
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("알림 읽음 처리 오류:", err);
    }
  }, []);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE"
        }
      );

      if (!response.ok) {
        throw new Error("알림 삭제에 실패했습니다.");
      }

      // 로컬 상태 업데이트
      setNotifications((prev) =>
        prev.filter((noti) => noti.id !== notificationId)
      );

      // 읽지 않은 알림 개수 갱신
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("알림 삭제 오류:", err);
    }
  }, []);

  // 특정 유형의 알림 필터링
  const filterNotificationsByType = useCallback(
    (type) => {
      return notifications.filter((noti) => noti.type === type);
    },
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    deleteNotification,
    filterNotificationsByType
  };
}

// 실시간 웹소켓 알림 훅
export function useWebSocketNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 웹소켓 연결 설정
    const socket = new WebSocket(`${WS_URL}/notifications`);

    socket.onopen = () => {
      console.log("웹소켓 알림 연결 성공");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const newNotification = JSON.parse(event.data);

        // 새 알림 추가 (최신 알림을 맨 앞에 추가)
        setNotifications((prev) => [newNotification, ...prev]);
      } catch (error) {
        console.error("웹소켓 메시지 파싱 오류:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("웹소켓 알림 연결 오류:", error);
      setIsConnected(false);
    };

    socket.onclose = () => {
      console.log("웹소켓 알림 연결 종료");
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  return {
    notifications,
    isConnected
  };
}

// 알림 렌더링 및 상호작용 훅
export function useNotificationInteractions(notifications) {
  const navigate = useNavigate();

  // 알림 클릭 핸들러
  const handleNotificationClick = useCallback(
    (notification) => {
      // 알림 읽음 처리
      markNotificationAsRead(notification.id);

      // 알림 소스 페이지로 네비게이션
      const destinationPath = navigateToNotificationSource(notification);
      navigate(destinationPath);
    },
    [navigate, markNotificationAsRead]
  );

  return {
    handleNotificationClick
  };
}
