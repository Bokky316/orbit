package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingParticipation;

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
public class BiddingParticipationDto {
    private Long id;
    
    // 연관 엔티티
    private Bidding bidding;
    private Long biddingId;
    
    // 공급자 정보
    private Long supplierId;
    private String companyName;
    
    // 금액 정보
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    // 참여 상태
    private LocalDateTime submittedAt;
    private boolean isConfirmed;
    private LocalDateTime confirmedAt;
    
    // 평가 정보
    private boolean isEvaluated;
    private Integer evaluationScore;
    
    // 발주 정보
    private boolean isOrderCreated;
    
    // 낙찰자 정보
    private boolean isSelectedBidder;
    private LocalDateTime selectedAt;
    
    // Entity -> DTO 변환
    public static BiddingParticipationDto fromEntity(BiddingParticipation entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingParticipationDto.builder()
                .id(entity.getId())
                .bidding(entity.getBidding())
                .biddingId(entity.getBiddingId())
                .supplierId(entity.getSupplierId())
                .companyName(entity.getCompanyName())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .submittedAt(entity.getSubmittedAt())
                .isConfirmed(entity.isConfirmed())
                .confirmedAt(entity.getConfirmedAt())
                .isEvaluated(entity.isEvaluated())
                .evaluationScore(entity.getEvaluationScore())
                .isOrderCreated(entity.isOrderCreated())
                .isSelectedBidder(entity.isSelectedBidder())
                .selectedAt(entity.getSelectedAt())
                .build();
    }
    
    // DTO -> Entity 변환
    public BiddingParticipation toEntity() {
        return BiddingParticipation.builder()
                .id(this.id)
                .bidding(this.bidding)
                .biddingId(this.biddingId)
                .supplierId(this.supplierId)
                .companyName(this.companyName)
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .build();
    }
}