package com.orbit.controller.websocket;

import com.orbit.event.dto.SupplierStatusEventDTO;
import com.orbit.service.supplier.SupplierRegistrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class SupplierWebSocketController {
    private final SupplierRegistrationService supplierRegistrationService;

    @MessageMapping("/supplier/{id}/status")
    @SendTo("/topic/supplier/{id}")
    public SupplierStatusEventDTO updateStatus(
            @DestinationVariable Long id,
            SupplierStatusEventDTO event
    ) {
        // 현재 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        log.info("웹소켓으로 공급업체 상태 변경 요청 수신: id={}, fromStatus={}, toStatus={}, user={}",
                id, event.getFromStatus(), event.getToStatus(), currentUsername);

        // 상태 변경 이벤트 처리
        supplierRegistrationService.updateSupplierStatusWithEvent(id, event.getToStatus(), currentUsername);

        return event;
    }
}
