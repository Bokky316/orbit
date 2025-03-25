package com.orbit.event.event;

import com.orbit.event.event.PurchaseRequestStatusChangeEvent;
import com.orbit.service.procurement.PurchaseRequestDashboardService;
import com.orbit.service.procurement.PurchaseRequestWebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 구매요청 대시보드 관련 이벤트 리스너
 * 구매요청 상태 변경 등의 이벤트를 수신하여 대시보드 데이터를 갱신하고 WebSocket으로 클라이언트에 알림
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PurchaseRequestDashboardEventListener {

    private final PurchaseRequestWebSocketService webSocketService;
    private final PurchaseRequestDashboardService dashboardService;

    /**
     * 구매요청 상태 변경 이벤트 처리
     * 상태 변경 시 대시보드 데이터를 갱신하고 WebSocket으로 클라이언트에 알림
     */
    @EventListener
    public void handlePurchaseRequestStatusChange(PurchaseRequestStatusChangeEvent event) {
        log.info("구매요청 상태 변경 이벤트 수신: 구매요청ID={}, 이전상태={}, 변경상태={}, 변경자={}",
                event.getPurchaseRequestId(), event.getFromStatus(), event.getToStatus(), event.getChangedBy());

        try {
            // 1. 대시보드 갱신 메시지 발송
            webSocketService.sendDashboardRefresh();

            // 2. 최신 대시보드 데이터 발송
            webSocketService.sendDashboardData();

            // 3. 해당 구매요청의 진행 상태 업데이트 발송
            webSocketService.sendRequestProgressUpdate(event.getPurchaseRequestId());

            // 4. 해당 구매요청이 연결된 프로젝트가 있으면 프로젝트별 목록 업데이트도 발송
            Long projectId = dashboardService.getProjectIdByRequestId(event.getPurchaseRequestId());
            if (projectId != null) {
                webSocketService.sendProjectRequestsUpdate(projectId);
            }

            log.debug("구매요청 상태 변경에 따른 WebSocket 메시지 발송 완료");
        } catch (Exception e) {
            log.error("구매요청 상태 변경 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 구매요청 생성 이벤트 처리
     * 새로운 구매요청이 생성되면 대시보드 데이터를 갱신하고 WebSocket으로 클라이언트에 알림
     */
    @EventListener
    public void handlePurchaseRequestCreated(Object event) {
        // 실제 구매요청 생성 이벤트 클래스로 수정 필요
        log.info("구매요청 생성 이벤트 수신");

        try {
            // 1. 대시보드 갱신 메시지 발송
            webSocketService.sendDashboardRefresh();

            // 2. 최신 대시보드 데이터 발송
            webSocketService.sendDashboardData();

            log.debug("구매요청 생성에 따른 WebSocket 메시지 발송 완료");
        } catch (Exception e) {
            log.error("구매요청 생성 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 구매요청 삭제 이벤트 처리
     * 구매요청이 삭제되면 대시보드 데이터를 갱신하고 WebSocket으로 클라이언트에 알림
     */
    @EventListener
    public void handlePurchaseRequestDeleted(Object event) {
        // 실제 구매요청 삭제 이벤트 클래스로 수정 필요
        log.info("구매요청 삭제 이벤트 수신");

        try {
            // 1. 대시보드 갱신 메시지 발송
            webSocketService.sendDashboardRefresh();

            // 2. 최신 대시보드 데이터 발송
            webSocketService.sendDashboardData();

            log.debug("구매요청 삭제에 따른 WebSocket 메시지 발송 완료");
        } catch (Exception e) {
            log.error("구매요청 삭제 이벤트 처리 중 오류 발생", e);
        }
    }
}