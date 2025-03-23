import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { changePurchaseRequestStatus, fetchPurchaseRequests } from "@/redux/purchaseRequestSlice";

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

        // 구매요청 ID별 토픽 구독 - 구매요청 상세 페이지에서 사용
        const purchaseRequestId = window.location.pathname.split('/').pop();
        if (purchaseRequestId && !isNaN(purchaseRequestId)) {
          client.subscribe(
            `/topic/purchase-request/${purchaseRequestId}`,
            (message) => {
              try {
                const updateData = JSON.parse(message.body);
                console.log("📣 구매요청 상태 업데이트 수신:", updateData);

                // 상태 코드 처리
                let statusCode = updateData.toStatus;

                // 상태 코드가 전체 형식(PURCHASE_REQUEST-STATUS-REQUESTED)으로 오는 경우 처리
                if (statusCode && statusCode.includes('-')) {
                  const parts = statusCode.split('-');
                  statusCode = parts.length >= 3 ? parts[2] : statusCode;
                }

                // 직접 상태 업데이트를 위한 액션 디스패치
                dispatch({
                  type: "purchaseRequest/wsUpdate",
                  payload: {
                    id: parseInt(purchaseRequestId),
                    prStatusChild: statusCode,
                    status: updateData.toStatus // 전체 상태 코드도 저장
                  }
                });
              } catch (error) {
                console.error("❌ 상태 업데이트 오류:", error);
              }
            }
          );
        }

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

        // 모든 구매요청 상태 변경 구독 (전체 업데이트용)
        client.subscribe(
          `/topic/purchase-requests`,
          (message) => {
            try {
              console.log("📣 전체 구매요청 업데이트 수신");
              // 구매요청 목록을 다시 불러옴
              dispatch(fetchPurchaseRequests());
            } catch (error) {
              console.error("❌ 전체 업데이트 오류:", error);
            }
          }
        );
      },

      onStompError: (frame) => {
        console.error("❌ WebSocket 연결 오류:", frame);
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log("🔌 WebSocket 연결 해제");
        setIsConnected(false);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [user, dispatch]);

  // 구매요청 상태 변경 함수
  const sendStatusChange = (purchaseRequestId, fromStatus, toStatus) => {
    if (stompClient && isConnected) {
      try {
        console.log(`📤 상태 변경 요청: ${purchaseRequestId}(${fromStatus} -> ${toStatus})`);

        // WebSocket을 통한 상태 변경 메시지 전송
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
        // 실패한 경우 HTTP API로 대체
        sendStatusChangeViaAPI(purchaseRequestId, fromStatus, toStatus);
      }
    } else {
      console.warn("⚠️ WebSocket 연결이 활성화되지 않았습니다. HTTP API 호출로 대체합니다.");
      // WebSocket 연결이 없을 경우 HTTP API 호출로 대체
      sendStatusChangeViaAPI(purchaseRequestId, fromStatus, toStatus);
    }
  };

  // HTTP API를 통한 상태 변경 함수
  const sendStatusChangeViaAPI = (purchaseRequestId, fromStatus, toStatus) => {
    dispatch(
      changePurchaseRequestStatus({
        id: purchaseRequestId,
        fromStatus,
        toStatus
      })
    ).then(() => {
      // 상태 변경 후 구매요청 목록 다시 불러오기
      dispatch(fetchPurchaseRequests());
    }).catch(error => {
      console.error('상태 변경 API 호출 실패:', error);
    });
  };

  return {
    sendStatusChange,
    isConnected
  };
};

export default useWebSocket;