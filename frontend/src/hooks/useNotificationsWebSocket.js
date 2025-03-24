// src/hooks/useNotificationsWebSocket.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  deleteNotification,
  addRealTimeNotification,
  resetRealTimeNotifications
} from "@/redux/notificationSlice";

export const useNotificationsWebSocket = (user) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  
  // 토스트 관련 상태
  const [visibleToast, setVisibleToast] = useState(null);
  const toastTimerRef = useRef(null);
  
  // Redux 상태 가져오기
  const notifications = useSelector(state => state.notifications?.items || []);
  const unreadCount = useSelector(state => state.notifications?.unreadCount || 0);
  const realTimeNotifications = useSelector(state => state.notifications?.realTimeNotifications || []);

  // 초기 데이터 로드
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
  }, [user, dispatch]);

  // 토스트 알림 처리
  useEffect(() => {
    if (realTimeNotifications.length > 0 && !visibleToast) {
      const latestNotification = realTimeNotifications[0];
      setVisibleToast(latestNotification);

      toastTimerRef.current = setTimeout(() => {
        setVisibleToast(null);
        dispatch(resetRealTimeNotifications());
      }, 5000);
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [realTimeNotifications, visibleToast, dispatch]);

  // WebSocket 연결
  useEffect(() => {
    if (!user?.id) return;

    const socket = new SockJS(`${SERVER_URL}ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("🔍 알림 WebSocket:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("📡 알림 WebSocket 연결 성공!");
        setIsConnected(true);

        // 사용자별 알림 구독
        client.subscribe(`/queue/user-${user.id}/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            dispatch(addRealTimeNotification(notification));
            dispatch(fetchUnreadCount());
          } catch (error) {
            console.error("❌ 알림 처리 오류:", error);
          }
        });
      },

      onStompError: (frame) => {
        console.error("❌ 알림 WebSocket 연결 오류:", frame);
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log("🔌 알림 WebSocket 연결 해제");
        setIsConnected(false);
      }
    });

    client.activate();
    setStompClient(client);

    // 주기적 알림 카운트 갱신
    const intervalId = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      if (client) {
        client.deactivate();
      }
    };
  }, [user, dispatch]);

  // 알림 읽음 처리
  const markNotificationAsRead = useCallback(
    (notificationId) => {
      dispatch(markAsRead(notificationId));
    },
    [dispatch]
  );

  // 알림 삭제
  const removeNotification = useCallback(
    (notificationId) => {
      dispatch(deleteNotification(notificationId));
    },
    [dispatch]
  );

  // 토스트 닫기
  const closeToast = useCallback(() => {
    setVisibleToast(null);
    dispatch(resetRealTimeNotifications());
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, [dispatch]);

  return {
    isConnected,
    notifications,
    unreadCount,
    markNotificationAsRead,
    removeNotification,
    toast: visibleToast,
    closeToast
  };
};