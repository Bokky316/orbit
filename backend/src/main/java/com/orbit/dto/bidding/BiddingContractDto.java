package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.member.Member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingContractDto {
    private Long id;
    private String transactionNumber;
    
    // 연관 엔티티
    private Bidding bidding;
    private Long biddingId;
    
    private BiddingParticipation biddingParticipation;
    private Long biddingParticipationId;
    
    private Member supplier;
    private Long supplierId;
    
    // 계약 기간
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate deliveryDate;
    
    // 금액 정보
    private BigDecimal totalAmount;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    
    // 상태 정보
    private ParentCode statusParent;
    private ChildCode statusChild;
    private String statusText;
    
    // 서명 정보
    private String buyerSignature;
    private LocalDateTime buyerSignedAt;
    private String supplierSignature;
    private LocalDateTime supplierSignedAt;
    
    // 기타 정보
    private String description;
    private String contractFilePath;
    
    // 시간 및 생성자 정보
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String modifiedBy;
    
    // 추가 편의 메서드
    public String getSignatureStatus() {
        if (buyerSignature != null && supplierSignature != null) {
            return "양측 서명 완료";
        } else if (buyerSignature != null) {
            return "구매자 서명 완료";
        } else if (supplierSignature != null) {
            return "공급자 서명 완료";
        } else {
            return "서명 대기중";
        }
    }
    
    // 상태 텍스트 가져오기 (UI 표시용)
    public String getStatusText() {
        if (this.statusChild == null) {
            return "미정";
        }
        
        return switch (this.statusChild.getCodeValue()) {
            case "DRAFT" -> "초안";
            case "IN_PROGRESS" -> "진행중";
            case "CLOSED" -> "완료";
            case "CANCELED" -> "취소";
            default -> this.statusChild.getCodeValue();
        };
    }
    
    // Entity -> DTO 변환
    public static BiddingContractDto fromEntity(BiddingContract entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingContractDto.builder()
                .id(entity.getId())
                .transactionNumber(entity.getTransactionNumber())
                .bidding(entity.getBidding())
                .biddingId(entity.getBidding() != null ? entity.getBidding().getId() : null)
                .biddingParticipation(entity.getBiddingParticipation())
                .biddingParticipationId(entity.getBiddingParticipation() != null ? entity.getBiddingParticipation().getId() : null)
                .supplier(entity.getSupplier())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .deliveryDate(entity.getDeliveryDate())
                .totalAmount(entity.getTotalAmount())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .statusParent(entity.getStatusParent())
                .statusChild(entity.getStatusChild())
                .buyerSignature(entity.getBuyerSignature())
                .buyerSignedAt(entity.getBuyerSignedAt())
                .supplierSignature(entity.getSupplierSignature())
                .supplierSignedAt(entity.getSupplierSignedAt())
                .description(entity.getDescription())
                .contractFilePath(entity.getContractFilePath())
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                .createdAt(entity.getRegTime())
                .updatedAt(entity.getUpdateTime())
                .build();
    }
    
    // DTO -> Entity 변환
    public BiddingContract toEntity() {
        return BiddingContract.builder()
                .id(this.id)
                .transactionNumber(this.transactionNumber)
                .bidding(this.bidding)
                .biddingParticipation(this.biddingParticipation)
                .supplier(this.supplier)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .deliveryDate(this.deliveryDate)
                .totalAmount(this.totalAmount)
                .quantity(this.quantity)
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .statusParent(this.statusParent)
                .statusChild(this.statusChild)
                .buyerSignature(this.buyerSignature)
                .buyerSignedAt(this.buyerSignedAt)
                .supplierSignature(this.supplierSignature)
                .supplierSignedAt(this.supplierSignedAt)
                .description(this.description)
                .contractFilePath(this.contractFilePath)
                .build();
    }
}