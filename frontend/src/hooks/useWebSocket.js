import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { changePurchaseRequestStatus } from "@/redux/purchaseRequestSlice";
import { updateSupplierStatus } from "@/redux/supplier/supplierSlice";
import { updateBiddingStatus } from "@/redux/biddingSlice";
import { addRealTimeNotification } from "@/redux/notificationSlice";

const useWebSocket = (user) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = new SockJS(`${SERVER_URL}ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("🔍 WebSocket Debug:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("📡 WebSocket 구매요청 연결 성공!");
        setIsConnected(true);

        // 모든 구매 요청 업데이트를 받기 위한 글로벌 토픽 구독 추가
        client.subscribe(
          `/topic/purchase-requests`,
          (message) => {
            try {
              console.log("📣 전체 구매요청 업데이트 수신");
              // 구매요청 목록을 다시 불러와 최신 상태 반영
              dispatch(fetchPurchaseRequests());
            } catch (error) {
              console.error("❌ 전체 업데이트 오류:", error);
            }
          }
        );

        // 현재 보고 있는 구매요청 ID 가져오기
        const path = window.location.pathname;
        const match = path.match(/\/purchase-requests\/(\d+)/);

        if (match && match[1]) {
          const purchaseRequestId = match[1];
          console.log(`구매요청 상세 페이지 감지: ID=${purchaseRequestId}`);

          // 특정 구매요청 토픽 구독
          client.subscribe(
            `/topic/purchase-request/${purchaseRequestId}`,
            (message) => {
              try {
                const updateData = JSON.parse(message.body);
                console.log("📣 구매요청 상태 업데이트 수신:", updateData);

                // 서버에서 보낸 데이터 형식 확인하여 처리
                if (updateData) {
                  let statusCode = null;

                  // 1. toStatus 필드가 있으면 그것을 사용
                  if (updateData.toStatus) {
                    // 전체 형식(PURCHASE_REQUEST-STATUS-REQUESTED)에서 마지막 부분 추출
                    if (updateData.toStatus.includes('-')) {
                      statusCode = updateData.toStatus.split('-')[2];
                    } else {
                      statusCode = updateData.toStatus;
                    }
                  }

                  if (statusCode) {
                    // 상태 업데이트를 위한 액션 디스패치
                    dispatch({
                      type: "purchaseRequest/wsUpdate",
                      payload: {
                        id: parseInt(purchaseRequestId),
                        purchaseRequestId: parseInt(purchaseRequestId),
                        prStatusChild: statusCode,
                        status: updateData.toStatus
                      }
                    });

                    // 즉시 데이터 다시 불러오기
                    dispatch(fetchPurchaseRequests());
                  }
                }
              } catch (error) {
                console.error("❌ 상태 업데이트 오류:", error);
              }
            }
          );

          // 결재 관련 토픽 구독 - 결재 알림 및 업데이트
          if (purchaseRequestId && !isNaN(purchaseRequestId)) {
            client.subscribe(
              `/topic/approvals/${purchaseRequestId}`,
              (message) => {
                try {
                  console.log("📣 결재선 업데이트 수신");
                  // 구매요청 데이터를 다시 불러와 최신 상태 반영
                  dispatch(fetchPurchaseRequests());
                } catch (error) {
                  console.error("❌ 결재선 업데이트 오류:", error);
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

        // 사용자별 개인 알림 구독
        client.subscribe(
          `/user/${user.username}/queue/notifications`,
          (message) => {
            try {
              const notification = JSON.parse(message.body);
              console.log("🔔 개인 알림 수신:", notification);
              // 알림 처리 로직
            } catch (error) {
              console.error("❌ 알림 처리 오류:", error);
            }
          }
        );
      },

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