package com.orbit.controller.websocket;

import com.orbit.event.dto.PurchaseRequestStatusEventDTO;
import com.orbit.service.procurement.PurchaseRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class PurchaseRequestWebSocketController {
    private final PurchaseRequestService purchaseRequestService;

    @MessageMapping("/purchase-request/{id}/status")
    @SendTo("/topic/purchase-request/{id}")
    public PurchaseRequestStatusEventDTO updateStatus(
            @DestinationVariable Long id,
            PurchaseRequestStatusEventDTO event
    ) {
        // 현재 인증된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        // 상태 변경 로직 호출
        purchaseRequestService.updatePurchaseRequestStatus(id, event.getToStatus(), currentUsername);

        return event;
    }
}