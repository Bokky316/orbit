package com.orbit.event.listener;

import com.orbit.event.handler.PurchaseRequestStateHandler;
import com.orbit.event.publisher.ProcessEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 구매 요청 상태 변경 요청 이벤트를 수신하여 처리하는 리스너
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PurchaseRequestStatusChangeListener {

    private final PurchaseRequestStateHandler stateHandler;

    /**
     * 구매 요청 상태 변경 요청 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handlePurchaseRequestStatusChangeRequest(ProcessEventPublisher.PurchaseRequestStatusChangeRequest event) {
        log.info("구매 요청({}) 상태 변경 요청 수신: 대상 상태={}, 요청자={}",
                event.getPurchaseRequestId(), event.getTargetStatus(), event.getUsername());

        boolean success = stateHandler.changeRequestStatus(
                event.getPurchaseRequestId(),
                event.getTargetStatus(),
                event.getUsername()
        );

        log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
    }

    /**
     * 입찰 공고 생성 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handleBiddingCreated(ProcessEventPublisher.BiddingCreatedEvent event) {
        log.info("입찰 공고({}) 생성 이벤트 수신: 구매 요청({})",
                event.getBiddingId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "VENDOR_SELECTION",
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }

    /**
     * 계약 생성 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handleContractCreated(ProcessEventPublisher.ContractCreatedEvent event) {
        log.info("계약({}) 생성 이벤트 수신: 구매 요청({})",
                event.getContractId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "CONTRACT_PENDING",
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }

    /**
     * 발주 생성 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handleOrderCreated(ProcessEventPublisher.OrderCreatedEvent event) {
        log.info("발주({}) 생성 이벤트 수신: 구매 요청({})",
                event.getOrderId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "CONTRACT_PENDING", // 발주 후에도 계약 대기 상태로 둘 수 있음
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }

    /**
     * 입고 처리 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handleDeliveryCreated(ProcessEventPublisher.DeliveryCreatedEvent event) {
        log.info("입고({}) 처리 이벤트 수신: 구매 요청({})",
                event.getDeliveryId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "INSPECTION",
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }

    /**
     * 인보이스 발행 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handleInvoiceCreated(ProcessEventPublisher.InvoiceCreatedEvent event) {
        log.info("인보이스({}) 발행 이벤트 수신: 구매 요청({})",
                event.getInvoiceId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "INVOICE_ISSUED",
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }

    /**
     * 결제 완료 이벤트 처리
     */
    @EventListener
    @Transactional
    public void handlePaymentCompleted(ProcessEventPublisher.PaymentCompletedEvent event) {
        log.info("결제({}) 완료 이벤트 수신: 구매 요청({})",
                event.getPaymentId(), event.getPurchaseRequestId());

        if (event.getPurchaseRequestId() != null) {
            boolean success = stateHandler.changeRequestStatus(
                    event.getPurchaseRequestId(),
                    "PAYMENT_COMPLETED",
                    "system"
            );

            log.info("구매 요청 상태 변경 결과: {}", success ? "성공" : "실패");
        }
    }
}