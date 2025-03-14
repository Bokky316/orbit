package com.orbit.service.delivery;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
//    private final InspectionRepository inspectionRepository;

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

    /*    Inspection inspection = new Inspection();
        inspection.setTransactionNumber(delivery.getOrderNumber());
        inspection.setCreatedAt(LocalDate.now());
        inspectionRepository.save(inspection);
        delivery.setInspection(inspection);*/

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

        /*if (delivery.getInspection() != null && requestDto.getDeliveryDate() != null) {
            delivery.getInspection().setInspectionDate(requestDto.getDeliveryDate());
            inspectionRepository.save(delivery.getInspection());
        }*/

        return DeliveryResponseDto.of(delivery);
    }

    @Transactional
    public void deleteDelivery(Long id) {
        Delivery delivery = findDeliveryById(id);

     /*   if (delivery.getInspection() != null) {
            inspectionRepository.delete(delivery.getInspection());
        }*/

        deliveryRepository.delete(delivery);
    }

    private Delivery findDeliveryById(Long id) {
        return deliveryRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Delivery not found"));
    }
}
