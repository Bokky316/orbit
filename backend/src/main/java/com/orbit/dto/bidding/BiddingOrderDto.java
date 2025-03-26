package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingOrder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 발주 정보 DTO 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingOrderDto {
    private Long id;
    private String orderNumber;
    private Long biddingId;
    private Long contractId; 
    private Long biddingParticipationId;
    private Long purchaseRequestItemId;
    private Long supplierId;
    private String supplierName;
    private Boolean isSelectedBidder;
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
    private LocalDateTime approvedAt;
    private Long approvalById;
    private String approvalByName;
    private LocalDateTime completedAt;
    private String completedBy;
    private LocalDateTime deliveredAt;
    private Long evaluationId;
    private String statusCode;
    private String statusName;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // 추가 표시 정보
    private String bidNumber;
    private String bidTitle;
    private String itemName;
    private String itemCode;
    
    /**
     * 엔티티를 DTO로 변환
     */
    public static BiddingOrderDto fromEntity(BiddingOrder entity) {
        BiddingOrderDto dto = BiddingOrderDto.builder()
                .id(entity.getId())
                .orderNumber(entity.getOrderNumber())
                .biddingId(entity.getBiddingId())
                .contractId(entity.getContractId())
                .biddingParticipationId(entity.getBiddingParticipationId())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
                .supplierId(entity.getSupplierId())
                .supplierName(entity.getSupplierName())
                .isSelectedBidder(entity.getIsSelectedBidder())
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
                .approvedAt(entity.getApprovedAt())
                .approvalById(entity.getApprovalById())
                .completedAt(entity.getCompletedAt())
                .completedBy(entity.getCompletedBy())
                .deliveredAt(entity.getDeliveredAt())
                .evaluationId(entity.getEvaluationId())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
                
        // 상태 정보 설정
        if (entity.getStatusChild() != null) {
            dto.setStatusCode(entity.getStatusChild().getCodeValue());
            dto.setStatusName(entity.getStatusChild().getCodeName());
        }
        
        // 연관된 입찰 정보 설정
        if (entity.getBidding() != null) {
            dto.setBidNumber(entity.getBidding().getBidNumber());
            dto.setBidTitle(entity.getBidding().getTitle());
        }
        
        // 아이템 정보 설정
        dto.setItemName(entity.getItemName());
        if (entity.getPurchaseRequestItem() != null && 
            entity.getPurchaseRequestItem().getItem() != null) {
            dto.setItemCode(entity.getPurchaseRequestItem().getItem().getCode());
        }
        
        return dto;
    }
    
    /**
     * DTO를 엔티티로 변환
     */
    public BiddingOrder toEntity() {
        return BiddingOrder.builder()
                .id(this.id)
                .orderNumber(this.orderNumber)
                .biddingId(this.biddingId)
                .contractId(this.contractId)
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
                .approvedAt(this.approvedAt)
                .approvalById(this.approvalById)
                .completedAt(this.completedAt)
                .completedBy(this.completedBy)
                .deliveredAt(this.deliveredAt)
                .evaluationId(this.evaluationId)
                .createdBy(this.createdBy)
                .build();
    }
}