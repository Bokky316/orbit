package com.orbit.config.websoket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;


/**
 * 웹소켓 설정
 * - STOMP 프로토콜을 사용하여 실시간 메시징을 처리하기 위한 설정
 * - 웹소켓을 사용하기 위한 설정 클래스
 * - WebSocketConfig는 STOMP 프로토콜을 사용하여 메시지를 주고받기 위한 설정
 * - STOMP 프로토콜을 사용하여 메시지 브로커를 설정, 메시지 브로커란 메시지를 중계하는 역할, 클라이언트와 서버 간의 메시지 교환을 돕는다.
 * - "/ws" 경로로 STOMP 웹소켓 엔드포인트를 등록, 클라이언트는 이 경로로 접속하여 웹소켓 연결을 요청, 웹소켓 연결을 요청하는 이유는? 웹소켓을 사용하여 실시간으로 메시지를 주고받기 위함
 * - "/topic"으로 시작하는 메시지를 메시지 브로커로 라우팅, 메시지 브로커는 이 메시지를 구독하고 있는 클라이언트에게 메시지를 전달, 클라이언트는 이 메시지를 구독하고 있다가 메시지를 받으면 화면에 표시
 * - "/app"으로 시작하는 메시지를 컨트롤러로 라우팅, 컨트롤러는 이 메시지를 처리하여 결과를 반환, 클라이언트는 이 결과를 화면에 표시, 이때 메시지 브로커는 라우팅만 수행하고 메시지를 중계하지 않음, 중계는 메시지 브로커가 수행
 */
@Configuration
@EnableWebSocketMessageBroker   // WebSocket 메시지 브로커를 사용하도록 설정
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 🔹 STOMP 웹소켓 엔드포인트 등록
     * - 프론트엔드에서 WebSocket을 연결할 엔드포인트
     * - /ws 엔드포인트가 STOMP 프로토콜을 지원하도록 설정됨: 이를 통해 React 클라이언트에서 ws://localhost:8080/ws로 접속 가능.
     *   useWebSocket.js에서 new SockJS(`${SERVER_URL}ws`);로 웹소켓에 접속 가능
     * - STOMP 프로토콜 : 웹소켓을 사용하기 위한 하위 프로토콜로 메시지 전송을 단순화하는 프로토콜, 메시지 전송을 위한 프로토콜
     * - /ws 엔드포인트로 클라이언트가 WebSocket 연결을 요청할 수 있도록 설정합니다. 이 엔드포인트에 SockJS를 사용하여 연결을 시도합니다.
     * - /ws 로 접속하면 SockJS를 통해 WebSocket 연결을 시도합니다. 즉 웹소켓을 활성화 하기 위한 설정
     * - 웹소켓 연결을 요청하는 이유는? 웹소켓을 사용하여 실시간으로 메시지를 주고받기 위함
     * - withSockJS()는 WebSocket이 지원되지 않는 환경에서 SockJS를 사용하여 대체 방식으로 연결을 시도합니다.
     * @param registry STOMP 엔드포인트 등록을 위한 레지스트리
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }


    /**
     * 🔹 메시지 브로커 설정, 이 설정은 WebSocket을 통해서 메시시 송수신을 할 때만 필요[미사용]
     * - "/topic" : 서버의 웹소켓에서 클라이언트로 메시지를 전송할 때 이런 형태로 구독을 하게 되면 메시지를 받을 수 있음
     * - /queue → 개인 메시지 (1:1 채팅) → 예: /queue/user-100
     * - "/app/chat" : 사용자가 "/app/chat"으로 메시지를 보내면 setApplicationDestinationPrefixes에 설정되어 있는 "/app"으로 시작하는 뒷부분의 경로로
     *   메시지를 보내게 되고, ChatController의 @MessageMapping("/chat") 엔드포인트에서 처리하게 된다.
     * - 하지만 웹소켓만을 써서 메시지를 주고 받는 것이 아니라면 사용하지 않아도 된다.
     *   우리는 Rest Api 형태로 메시지를 전송하고 중간에 Redis를 사용하여 메시지를 중계하고 또 그 메시지를
     *   Redis Subscriber에서 받아서 WebSocket을 통해 클라이언트에게 전달하기 때문에 사용하지 않음.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 구독 경로 설정
        registry.enableSimpleBroker("/topic", "/queue");

        // 메시지 처리 경로 접두사
        registry.setApplicationDestinationPrefixes("/app");

        // 사용자별 고유 큐 접두사
        registry.setUserDestinationPrefix("/user");
    }

    // 선택적: CORS 설정 추가
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowCredentials(true);
            }
        };
    }
}
