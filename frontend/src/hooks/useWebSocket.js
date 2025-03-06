import { useEffect } from "react";
import { useDispatch } from "react-redux";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { showSnackbar } from "@/store/snackbarSlice";
import { API_URL, SERVER_URL } from "@/utils/constants";
import { fetchWithAuth, fetchWithoutAuth } from "@/features/auth/fetchWithAuth";
import { setMessages, addMessage } from "@/store/messageSlice";

let stompClient = null;

const useWebSocket = (user) => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!user?.id || stompClient) return;

        console.log("🛠 WebSocket 연결 시도 - user ID:", user?.id);

        const socket = new SockJS(`${SERVER_URL}ws`);
        stompClient = new Client({
            webSocketFactory: () => socket,
            debug: (str) => console.log(`🔍 WebSocket Debug: ${str}`),
            reconnectDelay: 5000,

            onConnect: async () => {
                console.log("📡 WebSocket 연결 성공!");

                await fetchMessages(user.id, dispatch);

                stompClient.subscribe(`/topic/chat/${user.id}`, async (message) => {
                    console.log("📨 useWebSocket > stompClient.subscribe 새로운 메시지 도착! message.body : ", message.body);

                    const parsedMessage = JSON.parse(message.body);

                    dispatch(addMessage(parsedMessage));

                    await fetchMessages(user.id, dispatch);
                });
            },

            onStompError: (frame) => {
                console.error("❌ STOMP 오류 발생:", frame);
            },
        });

        stompClient.activate();

        return () => {
            if (stompClient) {
                stompClient.deactivate();
                stompClient = null;
            }
        };
    }, [user, dispatch]);
};

const fetchMessages = async (userId, dispatch) => {
    try {
        const response = await fetchWithAuth(`${API_URL}messages/${userId}`);
        if (response.ok) {
            const data = await response.json();
            dispatch(setMessages(data));
        }
    } catch (error) {
        console.error("🚨 메시지 목록 조회 실패:", error.message);
    }
};

export default useWebSocket;
