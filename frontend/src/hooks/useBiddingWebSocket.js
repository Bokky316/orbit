// src/hooks/useBiddingWebSocket.js
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { updateBiddingStatus, fetchBiddings } from "@/redux/biddingSlice";

export const useBiddingWebSocket = (user) => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBiddings());
    }
  }, [user, dispatch]);

  // WebSocket 연결
  useEffect(() => {
    if (!user?.id) return;

    const socket = new SockJS(`${SERVER_URL}ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("🔍 입찰 WebSocket:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log("📡 입찰 WebSocket 연결 성공!");
        setIsConnected(true);

        // 입찰 상태 변경 구독
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
      },

      onStompError: (frame) => {
        console.error("❌ 입찰 WebSocket 연결 오류:", frame);
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log("🔌 입찰 WebSocket 연결 해제");
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

  // 입찰 상태 변경 메서드
  const sendBiddingStatusChange = useCallback(
    (biddingId, fromStatus, toStatus) => {
      if (stompClient && isConnected) {
        try {
          stompClient.publish({
            destination: "/app/bidding/status",
            body: JSON.stringify({
              biddingId,
              fromStatus,
              toStatus
            })
          });
        } catch (error) {
          console.error("❌ 입찰 상태 변경 전송 실패:", error);
        }
      }
    },
    [stompClient, isConnected]
  );

  return {
    isConnected,
    sendBiddingStatusChange
  };
};
