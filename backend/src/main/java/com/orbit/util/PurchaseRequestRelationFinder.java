package com.orbit.util;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.invoice.Invoice;
import com.orbit.entity.paymant.Payment;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.bidding.BiddingRepository;
import com.orbit.repository.delivery.DeliveryRepository;
import com.orbit.repository.invoice.InvoiceRepository;
import com.orbit.repository.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 여러 모듈 간의 관계를 추적하여 구매 요청 ID를 찾는 유틸리티 클래스
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PurchaseRequestRelationFinder {

    private final BiddingRepository biddingRepository;
    private final BiddingContractRepository contractRepository;
    private final BiddingOrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;

    /**
     * 입찰 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromBidding(Long biddingId) {
        try {
            Optional<Bidding> bidding = biddingRepository.findByIdWithPurchaseRequest(biddingId);
            if (bidding.isPresent() && bidding.get().getPurchaseRequest() != null) {
                return bidding.get().getPurchaseRequest().getId();
            }
            return null;
        } catch (Exception e) {
            log.error("입찰 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 계약 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromContract(Long contractId) {
        try {
            Optional<BiddingContract> contract = contractRepository.findById(contractId);
            if (contract.isPresent() && contract.get().getBidding() != null) {
                return findPurchaseRequestIdFromBidding(contract.get().getBidding().getId());
            }
            return null;
        } catch (Exception e) {
            log.error("계약 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 발주 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromOrder(Long orderId) {
        try {
            Optional<BiddingOrder> order = orderRepository.findById(orderId);
            if (order.isPresent()) {
                // 1. 구매 요청 품목을 통한 연결 확인
                if (order.get().getPurchaseRequestItem() != null &&
                        order.get().getPurchaseRequestItem().getPurchaseRequest() != null) {
                    return order.get().getPurchaseRequestItem().getPurchaseRequest().getId();
                }

                // 2. 입찰을 통한 연결 확인
                Long biddingId = order.get().getBiddingId();
                if (biddingId != null) {
                    return findPurchaseRequestIdFromBidding(biddingId);
                }
            }
            return null;
        } catch (Exception e) {
            log.error("발주 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 입고 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromDelivery(Long deliveryId) {
        try {
            Optional<Delivery> delivery = deliveryRepository.findById(deliveryId);
            if (delivery.isPresent()) {
                // 1. 직접 연결된 purchaseRequestItem 확인
                if (delivery.get().getPurchaseRequestItem() != null &&
                        delivery.get().getPurchaseRequestItem().getPurchaseRequest() != null) {
                    return delivery.get().getPurchaseRequestItem().getPurchaseRequest().getId();
                }

                // 2. 발주를 통한 연결 확인
                BiddingOrder order = delivery.get().getBiddingOrder();
                if (order != null) {
                    return findPurchaseRequestIdFromOrder(order.getId());
                }
            }
            return null;
        } catch (Exception e) {
            log.error("입고 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 인보이스 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromInvoice(Long invoiceId) {
        try {
            Optional<Invoice> invoice = invoiceRepository.findById(invoiceId);
            if (invoice.isPresent() && invoice.get().getDelivery() != null) {
                return findPurchaseRequestIdFromDelivery(invoice.get().getDelivery().getId());
            }
            return null;
        } catch (Exception e) {
            log.error("인보이스 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 결제 ID로부터 구매 요청 ID 찾기
     */
    @Transactional(readOnly = true)
    public Long findPurchaseRequestIdFromPayment(Long paymentId) {
        try {
            Optional<Payment> payment = paymentRepository.findById(paymentId);
            if (payment.isPresent() && payment.get().getInvoice() != null) {
                return findPurchaseRequestIdFromInvoice(payment.get().getInvoice().getId());
            }
            return null;
        } catch (Exception e) {
            log.error("결제 ID로부터 구매 요청 ID 조회 중 오류: {}", e.getMessage());
            return null;
        }
    }
}