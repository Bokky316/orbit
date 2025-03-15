import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { changePurchaseRequestStatus } from "@/redux/purchaseRequestSlice";
import { updateSupplierStatus } from "@/redux/supplier/supplierSlice";
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

          // 1. 사용자 공급업체 ID별 구독 추가
          client.subscribe(`/topic/supplier/${user.id}`, (message) => {
            try {
              const updateData = JSON.parse(message.body);
              console.log(
                "📣 사용자별 공급업체 상태 변경 이벤트 수신:",
                updateData
              );
              dispatch(
                updateSupplierStatus({
                  id: updateData.supplierId,
                  fromStatus: updateData.fromStatus,
                  toStatus: updateData.toStatus
                })
              );
            } catch (error) {
              console.error("❌ 사용자별 협력업체 상태 업데이트 오류:", error);
            }
          });

          // 2. 공급업체 상태 변경 구독을 위한 준비
          // 참고: 현재 보고 있는 개별 공급업체에 대한 구독은
          // 해당 페이지에서 구체적인 supplierId를 알 때 subscribeToSupplier 메서드로 처리
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
      if (client) {
        client.deactivate();
      }
    };
  }, [user, dispatch]);

  const sendStatusChange = (purchaseRequestId, fromStatus, toStatus) => {
    if (stompClient && isConnected) {
      try {
        stompClient.publish({
          destination: "/app/purchase-request/status",
          body: JSON.stringify({
            purchaseRequestId,
            fromStatus,
            toStatus
          })
        });
      } catch (error) {
        console.error("❌ 상태 변경 전송 실패:", error);
      }
    }
  };

  // 공급업체 상태 변경 전송 메서드 추가
  const sendSupplierStatusChange = (supplierId, fromStatus, toStatus) => {
    if (stompClient && isConnected) {
      try {
        stompClient.publish({
          destination: `/app/supplier/${supplierId}/status`,
          body: JSON.stringify({
            supplierId,
            fromStatus,
            toStatus,
            changedBy: user?.username || "anonymous",
            timestamp: new Date().toISOString()
          })
        });
        console.log(
          `📤 공급업체 상태 변경 메시지 전송: ID=${supplierId}, ${fromStatus} → ${toStatus}`
        );
      } catch (error) {
        console.error("❌ 공급업체 상태 변경 전송 실패:", error);
      }
    } else {
      console.warn(
        "⚠️ WebSocket 연결이 활성화되지 않아 메시지를 전송할 수 없습니다."
      );
    }
  };

  // 공급업체 구독 메서드 추가
  const subscribeToSupplier = (supplierId) => {
    if (stompClient && isConnected && supplierId) {
      try {
        const subscription = stompClient.subscribe(
          `/topic/supplier/${supplierId}`,
          (message) => {
            try {
              const updateData = JSON.parse(message.body);
              console.log(
                `📣 공급업체(${supplierId}) 상태 변경 이벤트 수신:`,
                updateData
              );
              dispatch(
                updateSupplierStatus({
                  id: updateData.supplierId,
                  fromStatus: updateData.fromStatus,
                  toStatus: updateData.toStatus
                })
              );
            } catch (error) {
              console.error(
                `❌ 특정 공급업체(${supplierId}) 상태 업데이트 오류:`,
                error
              );
            }
          }
        );
        console.log(`✅ 공급업체(${supplierId}) 구독 성공`);
        return subscription; // 구독 해제를 위해 subscription 객체 반환
      } catch (error) {
        console.error(`❌ 공급업체(${supplierId}) 구독 실패:`, error);
        return null;
      }
    }
    return null;
  };

  // 구독 해제 메서드 추가
  const unsubscribeFromSupplier = (subscription) => {
    if (subscription) {
      try {
        subscription.unsubscribe();
        console.log("✅ 공급업체 구독 해제 성공");
      } catch (error) {
        console.error("❌ 공급업체 구독 해제 실패:", error);
      }
    }
  };

  return {
    sendStatusChange,
    sendSupplierStatusChange,
    subscribeToSupplier,
    unsubscribeFromSupplier,
    isConnected
  };
};

export default useWebSocket;
