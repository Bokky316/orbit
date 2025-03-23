package com.orbit.aspect;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.invoice.Invoice;
import com.orbit.entity.paymant.Payment;
import com.orbit.event.publisher.ProcessEventPublisher;
import com.orbit.util.PurchaseRequestRelationFinder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

/**
 * 각 모듈의 주요 메소드 실행 후 이벤트를 자동으로 발행하는 AOP 클래스
 * 기존 코드를 수정하지 않고 구매 요청 상태 변경 기능을 구현
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class ProcessEventAspects {

    private final ProcessEventPublisher eventPublisher;
    private final PurchaseRequestRelationFinder relationFinder;

    /**
     * 입찰 공고 생성 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.bidding.BiddingService.createBidding(..))")
    public void biddingCreatePointcut() {}

    /**
     * 계약 생성 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.bidding.BiddingService.createContractDraft(..))")
    public void contractCreatePointcut() {}

    /**
     * 발주 생성 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.bidding.BiddingOrderService.createOrder(..))")
    public void orderCreatePointcut() {}

    /**
     * 입고 처리 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.delivery.DeliveryService.createDelivery(..))")
    public void deliveryCreatePointcut() {}

    /**
     * 인보이스 발행 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.invoice.InvoiceService.createInvoice(..))")
    public void invoiceCreatePointcut() {}

    /**
     * 결제 완료 메소드 포인트컷
     */
    @Pointcut("execution(* com.orbit.service.payment.PaymentService.createPayment(..))")
    public void paymentCreatePointcut() {}

    /**
     * 입찰 공고 생성 후 처리
     */
    @AfterReturning(pointcut = "biddingCreatePointcut()", returning = "result")
    public void afterBiddingCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("입찰 공고 생성 메소드 실행 감지");

            // 반환된 DTO에서 필요한 정보 추출
            Long biddingId = getFieldValueSafely(result, "id");
            if (biddingId == null) {
                return;
            }

            // DTO에서 purchaseRequestId를 직접 가져오거나, 없으면 relationFinder로 조회
            Long purchaseRequestId = getFieldValueSafely(result, "purchaseRequestId");
            if (purchaseRequestId == null) {
                purchaseRequestId = relationFinder.findPurchaseRequestIdFromBidding(biddingId);
            }

            if (purchaseRequestId != null) {
                log.info("입찰 공고 생성 감지: 공고={}, 구매요청={}", biddingId, purchaseRequestId);
                eventPublisher.publishBiddingCreated(biddingId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("입찰 공고 생성 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 계약 생성 후 처리
     */
    @AfterReturning(pointcut = "contractCreatePointcut()", returning = "result")
    public void afterContractCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("계약 생성 메소드 실행 감지");

            // 반환된 값에서 ID 추출
            Long contractId = null;
            if (result instanceof Long) {
                contractId = (Long) result;
            } else {
                contractId = getFieldValueSafely(result, "id");
            }

            if (contractId == null) {
                return;
            }

            // PurchaseRequestRelationFinder 사용하여 관련 정보 조회
            Long purchaseRequestId = relationFinder.findPurchaseRequestIdFromContract(contractId);
            Long biddingId = null;

            if (purchaseRequestId != null) {
                log.info("계약 생성 감지: 계약={}, 구매요청={}", contractId, purchaseRequestId);
                eventPublisher.publishContractCreated(contractId, biddingId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("계약 생성 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 발주 생성 후 처리
     */
    @AfterReturning(pointcut = "orderCreatePointcut()", returning = "result")
    public void afterOrderCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("발주 생성 메소드 실행 감지");

            // 반환된 DTO에서 필요한 정보 추출
            Long orderId = getFieldValueSafely(result, "id");
            if (orderId == null) {
                return;
            }

            // relationFinder를 통해 관련 정보 조회
            Long purchaseRequestId = relationFinder.findPurchaseRequestIdFromOrder(orderId);
            Long biddingId = getFieldValueSafely(result, "biddingId");

            if (purchaseRequestId != null) {
                log.info("발주 생성 감지: 발주={}, 구매요청={}", orderId, purchaseRequestId);
                eventPublisher.publishOrderCreated(orderId, biddingId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("발주 생성 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 입고 처리 후 처리
     */
    @AfterReturning(pointcut = "deliveryCreatePointcut()", returning = "result")
    public void afterDeliveryCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("입고 처리 메소드 실행 감지");

            // 반환된 DTO에서 필요한 정보 추출
            Long deliveryId = getFieldValueSafely(result, "id");
            if (deliveryId == null) {
                return;
            }

            // relationFinder를 통해 관련 정보 조회
            Long purchaseRequestId = relationFinder.findPurchaseRequestIdFromDelivery(deliveryId);
            Long orderId = getFieldValueSafely(result, "orderId");

            if (purchaseRequestId != null) {
                log.info("입고 처리 감지: 입고={}, 구매요청={}", deliveryId, purchaseRequestId);
                eventPublisher.publishDeliveryCreated(deliveryId, orderId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("입고 처리 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 인보이스 발행 후 처리
     */
    @AfterReturning(pointcut = "invoiceCreatePointcut()", returning = "result")
    public void afterInvoiceCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("인보이스 발행 메소드 실행 감지");

            // 반환된 엔티티에서 필요한 정보 추출
            Long invoiceId = getFieldValueSafely(result, "id");
            if (invoiceId == null) {
                return;
            }

            // relationFinder를 통해 관련 정보 조회
            Long purchaseRequestId = relationFinder.findPurchaseRequestIdFromInvoice(invoiceId);

            if (purchaseRequestId != null) {
                log.info("인보이스 발행 감지: 인보이스={}, 구매요청={}", invoiceId, purchaseRequestId);
                eventPublisher.publishInvoiceCreated(invoiceId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("인보이스 발행 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 결제 완료 후 처리
     */
    @AfterReturning(pointcut = "paymentCreatePointcut()", returning = "result")
    public void afterPaymentCreate(JoinPoint joinPoint, Object result) {
        try {
            log.debug("결제 완료 메소드 실행 감지");

            // 반환된 DTO에서 필요한 정보 추출
            Long paymentId = getFieldValueSafely(result, "id");
            if (paymentId == null) {
                return;
            }

            // relationFinder를 통해 관련 정보 조회
            Long purchaseRequestId = relationFinder.findPurchaseRequestIdFromPayment(paymentId);
            Long invoiceId = getFieldValueSafely(result, "invoiceId");

            if (purchaseRequestId != null) {
                log.info("결제 완료 감지: 결제={}, 구매요청={}", paymentId, purchaseRequestId);
                eventPublisher.publishPaymentCompleted(paymentId, invoiceId, purchaseRequestId);
            }
        } catch (Exception e) {
            log.error("결제 완료 후 이벤트 발행 중 오류", e);
            // 예외를 삼키고 정상 흐름 유지
        }
    }

    /**
     * 객체에서 필드 값 안전하게 추출
     */
    @SuppressWarnings("unchecked")
    private <T> T getFieldValueSafely(Object object, String fieldName) {
        if (object == null) {
            return null;
        }

        try {
            // 먼저 직접 getter 메소드 호출 시도
            String getterName = "get" + fieldName.substring(0, 1).toUpperCase() + fieldName.substring(1);
            return (T) object.getClass().getMethod(getterName).invoke(object);
        } catch (Exception e) {
            try {
                // 메소드 호출 실패 시 필드 직접 접근 시도
                java.lang.reflect.Field field = object.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                return (T) field.get(object);
            } catch (Exception ex) {
                log.trace("객체에서 {} 필드 추출 실패: {}", fieldName, ex.getMessage());
                return null;
            }
        }
    }
}