package com.orbit.event.listener;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.invoice.Invoice;
import com.orbit.entity.paymant.Payment;
import com.orbit.event.handler.PurchaseRequestStateHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 다양한 프로세스 이벤트를 리스닝하여 구매 요청 상태를 자동으로 업데이트하는 리스너
 * 각 모듈의 이벤트를 받아 구매 요청 상태 변경 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProcessEventListeners {

    private final PurchaseRequestStateHandler stateHandler;

    /**
     * 입찰 공고 생성 이벤트 처리
     * 입찰 공고가 생성되면 구매 요청 상태를 "업체 선정" 단계로 변경
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = Bidding.class, condition = "#event.eventType == 'CREATED'")
    public void handleBiddingCreated(Object event) {
        try {
            // 이벤트에서 정보 추출 (실제 이벤트 구조에 맞게 수정 필요)
            Long biddingId = getFieldValueSafely(event, "id");
            Long purchaseRequestId = getFieldValueSafely(event, "purchaseRequestId");

            if (purchaseRequestId != null) {
                log.info("입찰 공고({}) 생성 이벤트 수신: 구매 요청({}) 상태 업데이트", biddingId, purchaseRequestId);

                // 구매 요청 상태를 "업체 선정(VENDOR_SELECTION)"으로 변경
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "VENDOR_SELECTION",
                        getCurrentUsername()
                );

                log.info("구매 요청 상태 업데이트 결과: {}", success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("입찰 공고 생성 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 계약 생성 이벤트 처리
     * 계약이 생성되면 구매 요청 상태를 "계약 대기" 단계로 변경
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = BiddingContract.class, condition = "#event.eventType == 'CREATED'")
    public void handleContractCreated(Object event) {
        try {
            Long contractId = getFieldValueSafely(event, "id");
            Long biddingId = getFieldValueSafely(event, "biddingId");
            Long purchaseRequestId = getFieldValueSafely(event, "purchaseRequestId");

            // 직접적인 관계가 없는 경우를 대비해 biddingId를 통해 purchaseRequestId 조회 필요
            if (purchaseRequestId == null && biddingId != null) {
                // Bidding에서 purchaseRequestId 조회 로직 필요
                // purchaseRequestId = biddingRepository.findPurchaseRequestIdByBiddingId(biddingId);
            }

            if (purchaseRequestId != null) {
                log.info("계약({}) 생성 이벤트 수신: 구매 요청({}) 상태 업데이트", contractId, purchaseRequestId);

                // 구매 요청 상태를 "계약 대기(CONTRACT_PENDING)"로 변경
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "CONTRACT_PENDING",
                        getCurrentUsername()
                );

                log.info("구매 요청 상태 업데이트 결과: {}", success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("계약 생성 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 발주 관련 이벤트 리스너 - 발주 생성 시 연관된 구매 요청 상태 업데이트
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = BiddingOrder.class, condition = "#event.getName() == 'OrderCreated'")
    public void handleOrderCreatedEvent(Object event) {
        try {
            // 이벤트에서 발주 ID와 구매 요청 ID 추출 (실제 이벤트 구조에 맞게 수정 필요)
            Long orderId = getFieldValueSafely(event, "orderId");
            Long purchaseRequestId = getFieldValueSafely(event, "purchaseRequestId");

            if (purchaseRequestId != null) {
                // 발주 정보로 구매 요청 상태 업데이트 - 발주 후 계약 대기 상태로 변경될 수 있음
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "CONTRACT_PENDING",
                        getCurrentUsername()
                );

                log.info("발주({}) 생성 이벤트로 구매 요청({}) 상태 업데이트 결과: {}",
                        orderId, purchaseRequestId, success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("발주 생성 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 입고 관련 이벤트 리스너 - 입고 처리 시 연관된 구매 요청 상태 업데이트
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = Delivery.class, condition = "#event.getName() == 'DeliveryCompleted'")
    public void handleDeliveryCreated(Object event) {
        try {
            // 이벤트에서 입고 ID와 구매 요청 ID 추출 (실제 이벤트 구조에 맞게 수정 필요)
            Long deliveryId = getFieldValueSafely(event, "deliveryId");
            Long purchaseRequestId = getFieldValueSafely(event, "purchaseRequestId");

            if (purchaseRequestId != null) {
                // 입고 정보로 구매 요청 상태 업데이트
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "INSPECTION",
                        getCurrentUsername()
                );

                log.info("입고({}) 완료 이벤트로 구매 요청({}) 상태 업데이트 결과: {}",
                        deliveryId, purchaseRequestId, success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("입고 처리 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 인보이스 발행 이벤트 처리
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = Invoice.class, condition = "#event.eventType == 'CREATED'")
    public void handleInvoiceCreated(Object event) {
        try {
            Long invoiceId = getFieldValueSafely(event, "id");
            Long purchaseRequestId = getFieldValueSafely(event, "purchaseRequestId");

            if (purchaseRequestId != null) {
                log.info("인보이스({}) 발행 이벤트 수신: 구매 요청({}) 상태 업데이트", invoiceId, purchaseRequestId);

                // 구매 요청 상태를 "인보이스 발행(INVOICE_ISSUED)"으로 변경
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "INVOICE_ISSUED",
                        getCurrentUsername()
                );

                log.info("구매 요청 상태 업데이트 결과: {}", success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("인보이스 발행 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 결제 완료 이벤트 처리
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(classes = Payment.class, condition = "#event.status == 'COMPLETED'")
    public void handlePaymentCompleted(Object event) {
        try {
            Long paymentId = getFieldValueSafely(event, "id");
            Long invoiceId = getFieldValueSafely(event, "invoiceId");

            // invoiceId로부터 purchaseRequestId 조회 로직 필요
            Long purchaseRequestId = null; // 실제 구현 필요

            if (purchaseRequestId != null) {
                log.info("결제({}) 완료 이벤트 수신: 구매 요청({}) 상태 업데이트", paymentId, purchaseRequestId);

                // 구매 요청 상태를 "대금지급 완료(PAYMENT_COMPLETED)"로 변경
                boolean success = stateHandler.changeRequestStatus(
                        purchaseRequestId,
                        "PAYMENT_COMPLETED",
                        getCurrentUsername()
                );

                log.info("구매 요청 상태 업데이트 결과: {}", success ? "성공" : "실패");
            }
        } catch (Exception e) {
            log.error("결제 완료 이벤트 처리 중 오류 발생", e);
        }
    }

    /**
     * 이벤트 객체에서 필드 값 추출 - 안전하게 예외 처리
     */
    @SuppressWarnings("unchecked")
    private <T> T getFieldValueSafely(Object event, String fieldName) {
        try {
            String getterName = "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            return (T) event.getClass().getMethod(getterName).invoke(event);
        } catch (Exception e) {
            log.debug("이벤트 객체에서 {} 필드 추출 실패", fieldName);
            return null;
        }
    }

    /**
     * 현재 로그인한 사용자명 조회
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }
}