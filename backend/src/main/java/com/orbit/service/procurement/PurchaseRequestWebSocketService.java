package com.orbit.service.procurement;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PurchaseRequestWebSocketService {
    private final SimpMessagingTemplate messagingTemplate;
    private final PurchaseRequestDashboardService dashboardService;

    public void sendStatusUpdateEvent(PurchaseRequestStatusEventDTO event) {
        messagingTemplate.convertAndSend(
                "/topic/purchase-request/" + event.getPurchaseRequestId(),
                event
        );
    }

    // 전체 구매요청 목록 업데이트를 위한 메소드
    public void sendGlobalStatusUpdate() {
        messagingTemplate.convertAndSend(
                "/topic/purchase-requests",
                "refresh"
        );
    }
}