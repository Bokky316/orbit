package com.orbit.service.delivery;

import com.orbit.dto.delivery.DeliveryDto;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.delivery.DeliveryRepository;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final BiddingOrderRepository biddingOrderRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final MemberRepository memberRepository;
//    private final InspectionRepository inspectionRepository;

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
}
