package com.orbit.service.procurement;

import com.orbit.dto.procurement.dashboard.PurchaseRequestDashboardDTO;
import com.orbit.event.dto.PurchaseRequestStatusEventDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

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

    /**
     * 대시보드 갱신 메시지 발송
     * 클라이언트에게 대시보드를 갱신하라는 신호를 보냄
     */
    public void sendDashboardRefresh() {
        messagingTemplate.convertAndSend(
                "/topic/purchase-request-dashboard",
                "refresh"
        );
    }

    /**
     * 대시보드 데이터 발송
     * 최신 대시보드 데이터를 클라이언트에게 직접 전송
     */
    public void sendDashboardData() {
        PurchaseRequestDashboardDTO dashboardData = dashboardService.getDashboardData();
        messagingTemplate.convertAndSend(
                "/topic/purchase-request-dashboard/data",
                dashboardData
        );
    }

    /**
     * 특정 구매요청 진행 상태 업데이트 발송
     * 특정 구매요청의 진행 상태가 변경되면 해당 정보를 전송
     */
    public void sendRequestProgressUpdate(Long requestId) {
        messagingTemplate.convertAndSend(
                "/topic/purchase-request-progress/" + requestId,
                "refresh"
        );
    }

    /**
     * 프로젝트별 구매요청 목록 업데이트 발송
     * 특정 프로젝트의 구매요청 목록이 변경되면 해당 정보를 전송
     */
    public void sendProjectRequestsUpdate(Long projectId) {
        messagingTemplate.convertAndSend(
                "/topic/project-purchase-requests/" + projectId,
                "refresh"
        );
    }
}