package com.orbit.event.listener;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;
import com.orbit.event.event.PurchaseRequestStatusChangeEvent;
import com.orbit.event.publisher.PurchaseRequestEventPublisher;
import com.orbit.service.procurement.PurchaseRequestWebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PurchaseRequestEventListener {
    private final PurchaseRequestWebSocketService webSocketService;
    private final PurchaseRequestEventPublisher redisEventPublisher;

    @EventListener
    public void handlePurchaseRequestStatusChange(PurchaseRequestStatusChangeEvent event) {
        PurchaseRequestStatusEventDTO eventDTO = PurchaseRequestStatusEventDTO.builder()
                .purchaseRequestId(event.getPurchaseRequestId())
                .fromStatus(event.getFromStatus())
                .toStatus(event.getToStatus())
                .changedBy(event.getChangedBy())
                .changedAt(event.getChangedAt())
                .build();

        // WebSocket으로 클라이언트에 전파
        webSocketService.sendStatusUpdateEvent(eventDTO);

        // Redis Pub/Sub 채널로 이벤트 발행
        redisEventPublisher.publishStatusChangeEvent(eventDTO);
    }
}