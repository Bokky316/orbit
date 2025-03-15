package com.orbit.dto.delivery;

import com.orbit.entity.delivery.Delivery;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryResponseDto {
    private Long id;
    private String deliveryNumber;
    private Long biddingOrderId;
    private String orderNumber;
    private Long supplierId;
    private String supplierName;
    private LocalDate deliveryDate;
    private Long receiverId;
    private String receiverName;
    private Long deliveryItemId;
    private String itemName;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime regTime;
    private LocalDateTime updateTime;
    
    // Entity -> DTO 변환
    public static DeliveryResponseDto of(Delivery delivery) {
        return DeliveryResponseDto.builder()
                .id(delivery.getId())
                .deliveryNumber(delivery.getDeliveryNumber())
                .biddingOrderId(delivery.getBiddingOrder().getId())
                .orderNumber(delivery.getOrderNumber())
                .supplierId(delivery.getSupplierId())
                .supplierName(delivery.getSupplierName())
                .deliveryDate(delivery.getDeliveryDate())
                .receiverId(delivery.getReceiver() != null ? delivery.getReceiver().getId() : null)
                .receiverName(delivery.getReceiver() != null ? delivery.getReceiver().getName() : null)
                .deliveryItemId(delivery.getDeliveryItemId())
                .totalAmount(delivery.getTotalAmount())
                .notes(delivery.getNotes())
                .regTime(delivery.getRegTime())
                .updateTime(delivery.getUpdateTime())
                .build();
    }
}