import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { SERVER_URL } from "@/utils/constants";
import { changePurchaseRequestStatus } from "@/redux/purchaseRequestSlice";

const useWebSocket = (user) => {
    const dispatch = useDispatch();
    const [isConnected, setIsConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        if (!user?.id) return;

        const socket = new SockJS(`${SERVER_URL}ws`);
        const client = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log('🔍 WebSocket Debug:', str),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log("📡 WebSocket 구매요청 연결 성공!");
                setIsConnected(true);

                // 사용자별 구매요청 상태 변경 구독
                client.subscribe(`/topic/purchase-request/user/${user.id}`, (message) => {
                    try {
                        const updateData = JSON.parse(message.body);
                        dispatch(changePurchaseRequestStatus({
                            id: updateData.purchaseRequestId,
                            fromStatus: updateData.fromStatus,
                            toStatus: updateData.toStatus
                        }));
                    } catch (error) {
                        console.error("❌ 상태 업데이트 오류:", error);
                    }
                });
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

    return {
        sendStatusChange,
        isConnected
    };
};

export default useWebSocket;