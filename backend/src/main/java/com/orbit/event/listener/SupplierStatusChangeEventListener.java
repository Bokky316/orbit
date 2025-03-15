package com.orbit.event.listener;

import com.orbit.event.dto.SupplierStatusEventDTO;
import com.orbit.event.event.SupplierStatusChangeEvent;
import com.orbit.service.supplier.SupplierWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class SupplierStatusChangeEventListener {

    private final SupplierWebSocketService supplierWebSocketService;

    @EventListener
    public void handleSupplierStatusChangeEvent(SupplierStatusChangeEvent event) {
        log.info("공급업체 상태 변경 이벤트 수신: supplierId={}, fromStatus={}, toStatus={}, username={}",
                event.getSupplierId(), event.getFromStatus(), event.getToStatus(), event.getUsername());

        // 상태 변경 이벤트 DTO 생성
        SupplierStatusEventDTO eventDTO = SupplierStatusEventDTO.builder()
                .supplierId(event.getSupplierId())
                .fromStatus(event.getFromStatus())
                .toStatus(event.getToStatus())
                .changedBy(event.getUsername())
                .timestamp(LocalDateTime.now())
                .build();

        // WebSocket 서비스를 통해 이벤트 전송
        supplierWebSocketService.sendStatusUpdateEvent(eventDTO);
    }
}
