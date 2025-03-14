package com.orbit.service.procurement;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;

import lombok.RequiredArgsConstructor;

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