package com.orbit.service.supplier;

import com.orbit.event.dto.SupplierStatusEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupplierWebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public void sendStatusUpdateEvent(SupplierStatusEventDTO event) {
        // 특정 공급업체 ID로 메시지 전송
        messagingTemplate.convertAndSend(
                "/topic/supplier/" + event.getSupplierId(),
                event
        );

        log.info("공급업체 상태 변경 이벤트 전송: supplierId={}, fromStatus={}, toStatus={}, changedBy={}",
                event.getSupplierId(), event.getFromStatus(), event.getToStatus(), event.getChangedBy());
    }
}
