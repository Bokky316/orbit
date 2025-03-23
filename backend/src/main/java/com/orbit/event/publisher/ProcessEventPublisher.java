package com.orbit.event.publisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * 다양한 프로세스 이벤트를 발행하는 유틸리티
 * 각 모듈에서 이 클래스를 통해 이벤트를 발행하면 관련 리스너가 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProcessEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * 구매 요청 상태 직접 변경 요청
     *
     * @param purchaseRequestId 구매 요청 ID
     * @param statusCode 변경할 상태 코드
     * @param username 변경 사용자
     */
    public void publishPurchaseRequestStatusChangeRequest(Long purchaseRequestId,
                                                          String statusCode,
                                                          String username) {
        PurchaseRequestStatusChangeRequest event = new PurchaseRequestStatusChangeRequest(
                purchaseRequestId, statusCode, username
        );

        log.info("구매 요청({}) 상태 변경 이벤트 발행: 목표 상태={}, 사용자={}",
                purchaseRequestId, statusCode, username);

        eventPublisher.publishEvent(event);
    }

    /**
     * 입찰 공고 생성 이벤트 발행
     */
    public void publishBiddingCreated(Long biddingId, Long purchaseRequestId) {
        BiddingCreatedEvent event = new BiddingCreatedEvent(biddingId, purchaseRequestId);
        log.info("입찰 공고 생성 이벤트 발행: 입찰={}, 구매요청={}", biddingId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    /**
     * 계약 생성 이벤트 발행
     */
    public void publishContractCreated(Long contractId, Long biddingId, Long purchaseRequestId) {
        ContractCreatedEvent event = new ContractCreatedEvent(contractId, biddingId, purchaseRequestId);
        log.info("계약 생성 이벤트 발행: 계약={}, 입찰={}, 구매요청={}",
                contractId, biddingId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    /**
     * 발주 생성 이벤트 발행
     */
    public void publishOrderCreated(Long orderId, Long biddingId, Long purchaseRequestId) {
        OrderCreatedEvent event = new OrderCreatedEvent(orderId, biddingId, purchaseRequestId);
        log.info("발주 생성 이벤트 발행: 발주={}, 입찰={}, 구매요청={}",
                orderId, biddingId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    /**
     * 입고 처리 이벤트 발행
     */
    public void publishDeliveryCreated(Long deliveryId, Long orderId, Long purchaseRequestId) {
        DeliveryCreatedEvent event = new DeliveryCreatedEvent(deliveryId, orderId, purchaseRequestId);
        log.info("입고 처리 이벤트 발행: 입고={}, 발주={}, 구매요청={}",
                deliveryId, orderId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    /**
     * 인보이스 발행 이벤트 발행
     */
    public void publishInvoiceCreated(Long invoiceId, Long purchaseRequestId) {
        InvoiceCreatedEvent event = new InvoiceCreatedEvent(invoiceId, purchaseRequestId);
        log.info("인보이스 발행 이벤트 발행: 인보이스={}, 구매요청={}", invoiceId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    /**
     * 결제 완료 이벤트 발행
     */
    public void publishPaymentCompleted(Long paymentId, Long invoiceId, Long purchaseRequestId) {
        PaymentCompletedEvent event = new PaymentCompletedEvent(paymentId, invoiceId, purchaseRequestId);
        log.info("결제 완료 이벤트 발행: 결제={}, 인보이스={}, 구매요청={}",
                paymentId, invoiceId, purchaseRequestId);
        eventPublisher.publishEvent(event);
    }

    // ===== 이벤트 클래스 정의 =====

    public static class PurchaseRequestStatusChangeRequest {
        private final Long purchaseRequestId;
        private final String targetStatus;
        private final String username;

        public PurchaseRequestStatusChangeRequest(Long purchaseRequestId, String targetStatus, String username) {
            this.purchaseRequestId = purchaseRequestId;
            this.targetStatus = targetStatus;
            this.username = username;
        }

        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getTargetStatus() { return targetStatus; }
        public String getUsername() { return username; }
    }

    public static class BiddingCreatedEvent {
        private final Long biddingId;
        private final Long purchaseRequestId;
        private final String eventType = "CREATED";

        public BiddingCreatedEvent(Long biddingId, Long purchaseRequestId) {
            this.biddingId = biddingId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getBiddingId() { return biddingId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getEventType() { return eventType; }
    }

    public static class ContractCreatedEvent {
        private final Long contractId;
        private final Long biddingId;
        private final Long purchaseRequestId;
        private final String eventType = "CREATED";

        public ContractCreatedEvent(Long contractId, Long biddingId, Long purchaseRequestId) {
            this.contractId = contractId;
            this.biddingId = biddingId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getContractId() { return contractId; }
        public Long getBiddingId() { return biddingId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getEventType() { return eventType; }
    }

    public static class OrderCreatedEvent {
        private final Long orderId;
        private final Long biddingId;
        private final Long purchaseRequestId;
        private final String eventType = "CREATED";

        public OrderCreatedEvent(Long orderId, Long biddingId, Long purchaseRequestId) {
            this.orderId = orderId;
            this.biddingId = biddingId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getOrderId() { return orderId; }
        public Long getBiddingId() { return biddingId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getEventType() { return eventType; }
    }

    public static class DeliveryCreatedEvent {
        private final Long deliveryId;
        private final Long orderId;
        private final Long purchaseRequestId;
        private final String eventType = "CREATED";

        public DeliveryCreatedEvent(Long deliveryId, Long orderId, Long purchaseRequestId) {
            this.deliveryId = deliveryId;
            this.orderId = orderId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getDeliveryId() { return deliveryId; }
        public Long getOrderId() { return orderId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getEventType() { return eventType; }
    }

    public static class InvoiceCreatedEvent {
        private final Long invoiceId;
        private final Long purchaseRequestId;
        private final String eventType = "CREATED";

        public InvoiceCreatedEvent(Long invoiceId, Long purchaseRequestId) {
            this.invoiceId = invoiceId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getInvoiceId() { return invoiceId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getEventType() { return eventType; }
    }

    public static class PaymentCompletedEvent {
        private final Long paymentId;
        private final Long invoiceId;
        private final Long purchaseRequestId;
        private final String status = "COMPLETED";

        public PaymentCompletedEvent(Long paymentId, Long invoiceId, Long purchaseRequestId) {
            this.paymentId = paymentId;
            this.invoiceId = invoiceId;
            this.purchaseRequestId = purchaseRequestId;
        }

        public Long getPaymentId() { return paymentId; }
        public Long getInvoiceId() { return invoiceId; }
        public Long getPurchaseRequestId() { return purchaseRequestId; }
        public String getStatus() { return status; }
    }
}