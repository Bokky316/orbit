package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingOrder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingOrderDto {
    private Long id;
    private String orderNumber;
    private Long biddingId;
    private Long biddingParticipationId;
    private Long purchaseRequestItemId;
    private Long supplierId;
    private String supplierName;
    private boolean isSelectedBidder;
    private LocalDateTime bidderSelectedAt;
    private String title;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    private String terms;
    private LocalDate expectedDeliveryDate;
    private Long evaluationId;
    private LocalDateTime approvedAt;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 추가 표시 정보
    private String bidNumber;
    private String bidTitle;
    private String itemName;
    
    public static BiddingOrderDto fromEntity(BiddingOrder entity) {
        return BiddingOrderDto.builder()
                .id(entity.getId())
                .orderNumber(entity.getOrderNumber())
                .biddingId(entity.getBiddingId())
                .biddingParticipationId(entity.getBiddingParticipationId())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
                .supplierId(entity.getSupplierId())
                .supplierName(entity.getSupplierName())
                .isSelectedBidder(entity.isSelectedBidder())
                .bidderSelectedAt(entity.getBidderSelectedAt())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .terms(entity.getTerms())
                .expectedDeliveryDate(entity.getExpectedDeliveryDate())
                .evaluationId(entity.getEvaluationId())
                .approvedAt(entity.getApprovedAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .itemName(entity.getPurchaseRequestItem().getItem().getName())
                .build();
    }
    
    public BiddingOrder toEntity() {
        return BiddingOrder.builder()
                .id(this.id)
                .orderNumber(this.orderNumber)
                .biddingId(this.biddingId)
                .biddingParticipationId(this.biddingParticipationId)
                .purchaseRequestItemId(this.purchaseRequestItemId)
                .supplierId(this.supplierId)
                .supplierName(this.supplierName)
                .isSelectedBidder(this.isSelectedBidder)
                .bidderSelectedAt(this.bidderSelectedAt)
                .title(this.title)
                .description(this.description)
                .quantity(this.quantity)
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .terms(this.terms)
                .expectedDeliveryDate(this.expectedDeliveryDate)
                .evaluationId(this.evaluationId)
                .approvedAt(this.approvedAt)
                .createdBy(this.createdBy)
                .build();
    }
}