import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { changePurchaseRequestStatus } from "@/redux/purchaseRequestSlice";
import { updateBiddingStatus } from "@/redux/biddingSlice";
import { addRealTimeNotification } from "@/redux/notificationSlice";

/**
 * 통합 웹소켓 훅 - 여러 기능의 웹소켓 통신을 하나의 연결로 처리
 * @param {Object} user - 사용자 정보
 * @param {Object} options - 활성화할 기능 옵션 (기본값은 모두 활성화)
 */
const useWebSocket = (user, options = {}) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef(null);
  const connectingRef = useRef(false);
  const reconnectTimerRef = useRef(null);

  // 기능별 활성화 상태
  const [features, setFeatures] = useState({
    purchaseRequests: options.purchaseRequests ?? true,
    biddings: options.biddings ?? false,
    notifications: options.notifications ?? false
  });

  // 웹소켓 연결 및 구독 설정
  useEffect(() => {
    if (!user?.id || connectingRef.current) return;

    connectingRef.current = true;

    // 연결 타임아웃 설정
    const connectionTimeoutId = setTimeout(() => {
      if (!isConnected) {
        console.warn("⚠️ WebSocket 연결 타임아웃");
        setIsConnected(false);
        connectingRef.current = false;
      }
    }, 10000); // 10초 후 타임아웃

    try {
      const socket = new SockJS(`${SERVER_URL}ws`);
      const client = new Client({
        webSocketFactory: () => socket,
        // debug 속성을 명시적으로 함수로 설정
        debug: function (str) {
          console.log("🔍 WebSocket Debug:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log("📡 WebSocket 연결 성공!");
          clearTimeout(connectionTimeoutId);
          setIsConnected(true);
          connectingRef.current = false;

          // 기능별 구독 설정
          if (features.purchaseRequests) {
            client.subscribe(
              `/topic/purchase-request/user/${user.id}`,
              (message) => {
                try {
                  const updateData = JSON.parse(message.body);
                  dispatch(
                    changePurchaseRequestStatus({
                      id: updateData.purchaseRequestId,
                      fromStatus: updateData.fromStatus,
                      toStatus: updateData.toStatus
                    })
                  );
                } catch (error) {
                  console.error("❌ 구매요청 상태 업데이트 오류:", error);
                }
              }
            );
          }

          if (features.biddings) {
            client.subscribe(`/topic/bidding/user/${user.id}`, (message) => {
              try {
                const updateData = JSON.parse(message.body);
                dispatch(
                  updateBiddingStatus({
                    id: updateData.biddingId,
                    previousStatus: updateData.fromStatus,
                    newStatus: updateData.toStatus
                  })
                );
              } catch (error) {
                console.error("❌ 입찰 상태 업데이트 오류:", error);
              }
            });
          }

          if (features.notifications) {
            client.subscribe(
              `/queue/user-${user.id}/notifications`,
              (message) => {
                try {
                  const notification = JSON.parse(message.body);
                  dispatch(addRealTimeNotification(notification));
                } catch (error) {
                  console.error("❌ 알림 처리 오류:", error);
                }
              }
            );
          }
        },

        onStompError: (frame) => {
          console.error("❌ WebSocket 연결 오류:", frame);
          clearTimeout(connectionTimeoutId);
          setIsConnected(false);
          connectingRef.current = false;
          scheduleReconnect();
        },

        onDisconnect: () => {
          console.log("🔌 WebSocket 연결 해제");
          setIsConnected(false);
          connectingRef.current = false;
          scheduleReconnect();
        }
      });

      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error("❌ WebSocket 설정 오류:", error);
      clearTimeout(connectionTimeoutId);
      setIsConnected(false);
      connectingRef.current = false;
      scheduleReconnect();
    }

    return () => {
      clearTimeout(connectionTimeoutId);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    };
  }, [user, dispatch, features]);

  // 재연결 스케줄
  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    reconnectTimerRef.current = setTimeout(() => {
      connectingRef.current = false; // 재연결 시도 가능하도록 플래그 리셋
    }, 5000);
  };

  // 구매요청 상태 변경 메시지 전송
  const sendStatusChange = (purchaseRequestId, fromStatus, toStatus) => {
    if (!stompClientRef.current || !isConnected) {
      console.warn("⚠️ WebSocket 연결이 없어 상태 변경을 전송할 수 없습니다");
      return false;
    }

    try {
      stompClientRef.current.publish({
        destination: "/app/purchase-request/status",
        body: JSON.stringify({
          purchaseRequestId,
          fromStatus,
          toStatus
        })
      });
      return true;
    } catch (error) {
      console.error("❌ 상태 변경 전송 실패:", error);
      return false;
    }
  };

  // 입찰 상태 변경 메시지 전송
  const sendBiddingStatusChange = (biddingId, fromStatus, toStatus) => {
    if (!features.biddings) {
      console.warn("⚠️ 입찰 기능이 비활성화되어 있습니다");
      return false;
    }

    if (!stompClientRef.current || !isConnected) {
      console.warn(
        "⚠️ WebSocket 연결이 없어 입찰 상태 변경을 전송할 수 없습니다"
      );
      return false;
    }

    try {
      stompClientRef.current.publish({
        destination: "/app/bidding/status",
        body: JSON.stringify({
          biddingId,
          fromStatus,
          toStatus
        })
      });
      return true;
    } catch (error) {
      console.error("❌ 입찰 상태 변경 전송 실패:", error);
      return false;
    }
  };

  // 알림 전송
  const sendNotification = (type, message, receiverId = null) => {
    if (!features.notifications) {
      console.warn("⚠️ 알림 기능이 비활성화되어 있습니다");
      return false;
    }

    if (!stompClientRef.current || !isConnected) {
      console.warn("⚠️ WebSocket 연결이 없어 알림을 전송할 수 없습니다");
      return false;
    }

    try {
      stompClientRef.current.publish({
        destination: "/app/notifications",
        body: JSON.stringify({
          type,
          message,
          senderId: user?.id,
          receiverId,
          timestamp: new Date().toISOString()
        })
      });
      return true;
    } catch (error) {
      console.error("❌ 알림 전송 실패:", error);
      return false;
    }
  };

  // 기능 활성화/비활성화
  const enableFeature = (feature, enabled = true) => {
    if (!["purchaseRequests", "biddings", "notifications"].includes(feature)) {
      console.error(`⚠️ 알 수 없는 기능: ${feature}`);
      return;
    }

    setFeatures((prev) => ({
      ...prev,
      [feature]: enabled
    }));
  };

  return {
    isConnected,
    features,
    enableFeature,
    sendStatusChange,
    sendBiddingStatusChange,
    sendNotification
  };
};

export default useWebSocket;