package com.orbit.service.delivery;

import com.orbit.dto.bidding.BiddingOrderDto;
import com.orbit.dto.delivery.DeliveryResponseDto;
import com.orbit.dto.delivery.DeliveryRequestDto;
import com.orbit.dto.delivery.DeliveryUpdateRequest;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.member.Member;
import com.orbit.repository.bidding.BiddingOrderRepository;
import com.orbit.repository.delivery.DeliveryRepository;
import com.orbit.repository.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final BiddingOrderRepository biddingOrderRepository;
    private final MemberRepository memberRepository;

    public Page<DeliveryResponseDto> getDeliveryList(
            String deliveryNumber, String orderNumber, Long supplierId,
            LocalDate startDate, LocalDate endDate, Long receiverId,
            String deliveryItemId, Pageable pageable) {

        Page<Delivery> deliveries = deliveryRepository.findByConditions(
                deliveryNumber, orderNumber, supplierId, startDate, endDate, receiverId, deliveryItemId, pageable);

        return deliveries.map(DeliveryResponseDto::of);
    }

    public List<DeliveryResponseDto> getAllDeliveries() {
        List<Delivery> deliveries = deliveryRepository.findAll();
        return deliveries.stream()
                .map(DeliveryResponseDto::of)
                .collect(Collectors.toList());
    }

    public List<DeliveryResponseDto> getCurrentMonthDeliveries() {
        List<Delivery> deliveries = deliveryRepository.findCurrentMonthDeliveries();
        return deliveries.stream()
                .map(DeliveryResponseDto::of)
                .collect(Collectors.toList());
    }

    public DeliveryResponseDto getDelivery(Long id) {
        Delivery delivery = findDeliveryById(id);
        return DeliveryResponseDto.of(delivery);
    }

    public DeliveryResponseDto getDeliveryByNumber(String deliveryNumber) {
        Delivery delivery = deliveryRepository.findByDeliveryNumber(deliveryNumber)
                .orElseThrow(() -> new NoSuchElementException("Delivery not found"));
        return DeliveryResponseDto.of(delivery);
    }

    @Transactional
    public DeliveryResponseDto createDelivery(DeliveryRequestDto requestDto) {
        BiddingOrder biddingOrder = biddingOrderRepository.findById(requestDto.getBiddingOrderId())
                .orElseThrow(() -> new NoSuchElementException("Bidding order not found"));

        Member receiver = null;
        if (requestDto.getReceiverId() != null) {
            receiver = memberRepository.findById(requestDto.getReceiverId())
                    .orElseThrow(() -> new NoSuchElementException("Receiver not found"));
        }

        Delivery delivery = Delivery.builder()
                .biddingOrder(biddingOrder)
                .orderNumber(biddingOrder.getOrderNumber())
                .supplierId(requestDto.getSupplierId())
                .supplierName(requestDto.getSupplierName())
                .deliveryDate(requestDto.getDeliveryDate())
                .receiver(receiver)
                .deliveryItemId(requestDto.getDeliveryItemId())
                .totalAmount(requestDto.getTotalAmount())
                .notes(requestDto.getNotes())
                .build();

        delivery = deliveryRepository.save(delivery);

        return DeliveryResponseDto.of(delivery);
    }

    @Transactional
    public DeliveryResponseDto updateDelivery(Long id, DeliveryUpdateRequest requestDto) {
        Delivery delivery = findDeliveryById(id);

        Member receiver = null;
        if (requestDto.getReceiverId() != null) {
            receiver = memberRepository.findById(requestDto.getReceiverId())
                    .orElseThrow(() -> new NoSuchElementException("Receiver not found"));
        }

        if (requestDto.getDeliveryDate() != null) {
            delivery.setDeliveryDate(requestDto.getDeliveryDate());
        }
        if (receiver != null) {
            delivery.setReceiver(receiver);
        }
        if (requestDto.getDeliveryItemId() != null) {
            delivery.setDeliveryItemId(requestDto.getDeliveryItemId());
        }
        if (requestDto.getTotalAmount() != null) {
            delivery.setTotalAmount(requestDto.getTotalAmount());
        }
        if (requestDto.getNotes() != null) {
            delivery.setNotes(requestDto.getNotes());
        }

        delivery.setUpdateTime(LocalDateTime.now());

        return DeliveryResponseDto.of(delivery);
    }

    @Transactional
    public void deleteDelivery(Long id) {
        Delivery delivery = findDeliveryById(id);

        deliveryRepository.delete(delivery);
    }

    private Delivery findDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Delivery not found"));
    }

    /**
     * 아직 입고등록이 되지 않은 발주 목록을 조회합니다.
     * @return 미입고 발주 목록
     */
    public List<BiddingOrderDto> getAvailableOrders() {
        // 이미 입고된 발주 ID 목록 조회
        List<Long> deliveredOrderIds = deliveryRepository.findDeliveredOrderIds();
        System.out.println("🚀 [DEBUG] 이미 입고된 발주 ID 목록: " + deliveredOrderIds);

        List<BiddingOrder> availableOrders;
        if (deliveredOrderIds.isEmpty()) {
            // 입고된 발주가 없는 경우 모든 발주 목록 반환
            availableOrders = biddingOrderRepository.findAllOrders();
        } else {
            // 입고되지 않은 발주 목록 조회
            availableOrders = biddingOrderRepository.findByIdNotIn(deliveredOrderIds);
        }

        System.out.println("✅ [DEBUG] 입고되지 않은 발주 목록: " + availableOrders);

        // BiddingOrderService의 convertToDto 메소드를 활용하거나
        // BiddingOrderDto.fromEntity 메소드를 활용하여 변환
        return availableOrders.stream()
                .map(BiddingOrderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public BiddingOrderDto getOrderDetails(String orderNumber) {
        return biddingOrderRepository.findByOrderNumber(orderNumber)
                .map(BiddingOrderDto::fromEntity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "해당 발주번호를 찾을 수 없습니다: " + orderNumber));
    }
}
