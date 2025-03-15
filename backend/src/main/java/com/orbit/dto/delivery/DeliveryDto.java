package com.orbit.dto.delivery;

import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.member.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DeliveryDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private Long id;
        private String deliveryNumber;
        private Long biddingOrderId;
        private String orderNumber;
        private Long supplierId;
        private String supplierName;
        private LocalDate deliveryDate;
        private Long receiverId;
        private String notes;
        private BigDecimal totalAmount;
        private Long purchaseRequestItemId;
        private Long deliveryItemId;
        private String itemId;
        private String itemName;
        private String itemSpecification;
        private Integer itemQuantity;
        private BigDecimal itemUnitPrice;
        private String itemUnit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String deliveryNumber;
        private Long biddingOrderId;
        private String orderNumber;
        private Long supplierId;
        private String supplierName;
        private LocalDate deliveryDate;
        private Long receiverId;
        private String receiverName;
        private String notes;
        private BigDecimal totalAmount;
        private Long purchaseRequestItemId;
        private Long deliveryItemId;
        private String itemId;
        private String itemName;
        private String itemSpecification;
        private Integer itemQuantity;
        private BigDecimal itemUnitPrice;
        private String itemUnit;
        private LocalDateTime regTime;
        private LocalDateTime updateTime;

        public static Response fromEntity(Delivery delivery) {
            ResponseBuilder builder = Response.builder()
                    .id(delivery.getId())
                    .deliveryNumber(delivery.getDeliveryNumber())
                    .biddingOrderId(delivery.getBiddingOrder() != null ? delivery.getBiddingOrder().getId() : null)
                    .orderNumber(delivery.getOrderNumber())
                    .supplierId(delivery.getSupplierId())
                    .supplierName(delivery.getSupplierName())
                    .deliveryDate(delivery.getDeliveryDate())
                    .notes(delivery.getNotes())
                    .totalAmount(delivery.getTotalAmount())
                    .purchaseRequestItemId(delivery.getPurchaseRequestItem() != null ? delivery.getPurchaseRequestItem().getId() : null)
                    .deliveryItemId(delivery.getDeliveryItemId())
                    .itemId(delivery.getItemId())
                    .itemName(delivery.getItemName())
                    .itemSpecification(delivery.getItemSpecification())
                    .itemQuantity(delivery.getItemQuantity())
                    .itemUnitPrice(delivery.getItemUnitPrice())
                    .itemUnit(delivery.getItemUnit())
                    .regTime(delivery.getRegTime())
                    .updateTime(delivery.getUpdateTime());

            if (delivery.getReceiver() != null) {
                builder.receiverId(delivery.getReceiver().getId());
                builder.receiverName(delivery.getReceiver().getName());
            }

            return builder.build();
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCondition {
        private String deliveryNumber;
        private String orderNumber;
        private Long supplierId;
        private String supplierName;
        private LocalDate startDate;
        private LocalDate endDate;
        private int page;
        private int size;
    }
}