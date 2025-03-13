package com.orbit.service.event;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PurchaseRequestWebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public void sendStatusUpdateEvent(PurchaseRequestStatusEventDTO event) {
        messagingTemplate.convertAndSend(
                "/topic/purchase-request/" + event.getPurchaseRequestId(),
                event
        );
    }
}