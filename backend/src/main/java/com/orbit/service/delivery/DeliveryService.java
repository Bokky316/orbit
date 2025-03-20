package com.orbit.service.delivery;

import com.orbit.dto.delivery.DeliveryDto;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.bidding.BiddingContractRepository;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.delivery.DeliveryRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import com.orbit.service.bidding.BiddingContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final BiddingOrderRepository biddingOrderRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final MemberRepository memberRepository;
    private final BiddingContractRepository biddingContractRepository;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DeliveryService.class);

    /**
     * 입고 목록 조회
     */
    public Page<DeliveryDto.Response> getDeliveries(DeliveryDto.SearchCondition condition) {
        Pageable pageable = PageRequest.of(condition.getPage(), condition.getSize());

        Page<Delivery> deliveries = deliveryRepository.searchDeliveries(
                condition.getDeliveryNumber(),
                condition.getOrderNumber(),
                condition.getSupplierId(),
                condition.getSupplierName(),
                condition.getStartDate(),
                condition.getEndDate(),
                condition.getInvoiceIssued(),
                pageable
        );

        return deliveries.map(DeliveryDto.Response::fromEntity);
    }

    /**
     * 입고 상세 조회
     */
    public DeliveryDto.Response getDelivery(Long id) {
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 입고입니다. ID: " + id));

        return DeliveryDto.Response.fromEntity(delivery);
    }

    /**
     * 입고번호로 조회
     */
    public DeliveryDto.Response getDeliveryByNumber(String deliveryNumber) {
        Delivery delivery = deliveryRepository.findByDeliveryNumber(deliveryNumber)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 입고번호입니다: " + deliveryNumber));

        return DeliveryDto.Response.fromEntity(delivery);
    }

    /**
     * 입고 등록
     */
    @Transactional
    public DeliveryDto.Response createDelivery(DeliveryDto.Request request) {
        try {
            // 필수 데이터 검증
            if (request.getBiddingOrderId() == null) {
                throw new IllegalArgumentException("발주 ID는 필수입니다.");
            }

            if (request.getDeliveryDate() == null) {
                throw new IllegalArgumentException("입고일은 필수입니다.");
            }

            // 발주 조회
            BiddingOrder biddingOrder = biddingOrderRepository.findById(request.getBiddingOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 발주입니다. ID: " + request.getBiddingOrderId()));

            // 구매요청품목 조회 (null 허용)
            PurchaseRequestItem purchaseRequestItem = null;
            if (request.getPurchaseRequestItemId() != null) {
                try {
                    purchaseRequestItem = purchaseRequestItemRepository.findById(request.getPurchaseRequestItemId())
                            .orElse(null); // 없어도 진행
                } catch (Exception e) {
                    // 조회 중 오류가 발생해도 계속 진행
                    log.warn("구매요청품목 조회 중 오류 발생: {}", e.getMessage());
                }
            }

            // 입고 담당자 조회 (null 허용)
            Member receiver = null;
            if (request.getReceiverId() != null) {
                try {
                    receiver = memberRepository.findById(request.getReceiverId())
                            .orElse(null); // 없어도 진행
                } catch (Exception e) {
                    // 조회 중 오류가 발생해도 계속 진행
                    log.warn("입고 담당자 조회 중 오류 발생: {}", e.getMessage());
                }
            }

            // 입고 엔티티 생성
            Delivery delivery = Delivery.builder()
                    .biddingOrder(biddingOrder)
                    .purchaseRequestItem(purchaseRequestItem)
                    .receiver(receiver)
                    .deliveryDate(request.getDeliveryDate())
                    .notes(request.getNotes())
                    .build();

            // 발주 정보로부터 입고 정보 설정
            delivery.setFromBiddingOrder(biddingOrder, purchaseRequestItem);

            // 명시적으로 품목 ID 설정 (클라이언트에서 전달된 값이 있으면 우선 사용)
            if (request.getDeliveryItemId() != null) {
                delivery.setDeliveryItemId(request.getDeliveryItemId());
            } else if (purchaseRequestItem != null) {
                delivery.setDeliveryItemId(purchaseRequestItem.getId());
            }

            // 추가 정보 설정
            if (request.getSupplierId() != null) {
                delivery.setSupplierId(request.getSupplierId());
            }

            if (request.getSupplierName() != null) {
                delivery.setSupplierName(request.getSupplierName());
            }

            // 수량 정보가 요청에 포함되어 있으면 우선 적용
            if (request.getItemQuantity() != null) {
                delivery.setItemQuantity(request.getItemQuantity());
            }

            // 저장
            Delivery savedDelivery = deliveryRepository.save(delivery);

            return DeliveryDto.Response.fromEntity(savedDelivery);
        } catch (Exception e) {
            log.error("입고 등록 중 예외 발생:", e);
            throw e; // 상위 호출자에게 예외 전파
        }
    }

    /**
     * 입고 수정
     */
    @Transactional
    public DeliveryDto.Response updateDelivery(Long id, DeliveryDto.Request request) {
        // 기존 입고 조회
        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 입고입니다. ID: " + id));

        // 입고 담당자 조회
        if (request.getReceiverId() != null) {
            Member receiver = memberRepository.findById(request.getReceiverId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다. ID: " + request.getReceiverId()));
            delivery.setReceiver(receiver);
        }

        // 입고 정보 업데이트
        delivery.setDeliveryDate(request.getDeliveryDate());
        delivery.setNotes(request.getNotes());
        delivery.setItemQuantity(request.getItemQuantity());

        // 저장
        Delivery updatedDelivery = deliveryRepository.save(delivery);

        return DeliveryDto.Response.fromEntity(updatedDelivery);
    }

    /**
     * 발주에 대한 입고 목록 조회
     */
    public List<DeliveryDto.Response> getDeliveriesByBiddingOrderId(Long biddingOrderId) {
        List<Delivery> deliveries = deliveryRepository.findByBiddingOrderId(biddingOrderId);

        return deliveries.stream()
                .map(DeliveryDto.Response::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 입고 삭제
     */
    @Transactional
    public void deleteDelivery(Long id) {
        deliveryRepository.deleteById(id);
    }

    public Optional<Delivery> getDeliveryById(Long id) {
        return deliveryRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUninvoicedDeliveriesWithContracts() {
        List<Delivery> deliveries = deliveryRepository.findByInvoiceIssuedFalse();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Delivery delivery : deliveries) {
            Map<String, Object> item = new HashMap<>();

            // 기본 정보
            item.put("id", delivery.getId());
            item.put("deliveryNumber", delivery.getDeliveryNumber());
            item.put("orderNumber", delivery.getOrderNumber());
            item.put("supplierId", delivery.getSupplierId());
            item.put("supplierName", delivery.getSupplierName());
            item.put("itemName", delivery.getItemName());
            item.put("itemQuantity", delivery.getItemQuantity());
            item.put("totalAmount", delivery.getTotalAmount());
            item.put("invoiceIssued", delivery.getInvoiceIssued());

            // 공급자 정보 추가 조회 (중요!)
            try {
                // 공급자 ID로 회원 정보 조회
                Optional<Member> supplierOpt = memberRepository.findById(delivery.getSupplierId());
                if (supplierOpt.isPresent()) {
                    Member supplier = supplierOpt.get();

                    // 공급자 추가 정보 설정
                    item.put("supplierUserName", supplier.getUsername());
                    item.put("supplierContactPerson", supplier.getName());
                    item.put("supplierEmail", supplier.getEmail());
                    item.put("supplierPhone", supplier.getContactNumber());

                    // 주소 조합
                    String fullAddress = "";
                    if (supplier.getRoadAddress() != null) {
                        fullAddress = supplier.getRoadAddress();
                        if (supplier.getDetailAddress() != null) {
                            fullAddress += " " + supplier.getDetailAddress();
                        }
                    }
                    item.put("supplierAddress", fullAddress);
                }
            } catch (Exception e) {
                log.warn("공급자 정보 조회 중 오류 발생: {}", e.getMessage());
                // 기본값 설정
                item.put("supplierUserName", String.valueOf(delivery.getSupplierId()));
                item.put("supplierContactPerson", delivery.getSupplierName() + " 담당자");
                item.put("supplierEmail", "-");
                item.put("supplierPhone", "-");
                item.put("supplierAddress", "-");
            }

            // 계약 번호 조회 (BiddingOrder → Bidding → BiddingContract 관계를 통해)
            String contractNumber = null;
            if (delivery.getBiddingOrder() != null && delivery.getBiddingOrder().getBidding() != null) {
                // 계약 번호를 조회하는 복잡한 로직
                // 예: BiddingContract 엔티티에서 bidding_id로 조회하여 transactionNumber 가져오기
                // 실제 구현은 관계 설정에 따라 달라질 수 있음
                BiddingOrder order = delivery.getBiddingOrder();
                List<BiddingContract> contracts = biddingContractRepository.findByBiddingId(order.getBiddingId());
                if (!contracts.isEmpty()) {
                    contractNumber = contracts.get(0).getTransactionNumber();
                }
            }

            item.put("contractNumber", contractNumber);
            result.add(item);
        }

        return result;
    }
}