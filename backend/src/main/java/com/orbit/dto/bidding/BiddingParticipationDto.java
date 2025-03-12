package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
    private Long biddingId;
    private Long supplierId;
    private String supplierName;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    private LocalDateTime submittedAt;
    private boolean confirmed; // isConfirmed 대신 confirmed 사용
    private LocalDateTime confirmedAt;
    private boolean evaluated; // isEvaluated 대신 evaluated 사용
    private Integer evaluationScore;
    private boolean isOrderCreated = false;

    // Entity -> DTO 변환
    public static BiddingParticipationDto fromEntity(BiddingParticipation entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingParticipationDto.builder()
                .id(entity.getId())
                .biddingId(entity.getBiddingId())
                .supplierId(entity.getSupplierId())
                .supplierName(entity.getSupplierName())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .submittedAt(entity.getSubmittedAt())
                .confirmed(entity.isConfirmed()) // isConfirmed 메서드 사용
                .confirmedAt(entity.getConfirmedAt())
                .evaluated(entity.isEvaluated()) // isEvaluated 메서드 사용
                .evaluationScore(entity.getEvaluationScore())
                .isOrderCreated(entity.isOrderCreated())
                .build();
    }

    // DTO -> Entity 변환
    public BiddingParticipation toEntity() {
        BiddingParticipation participation = BiddingParticipation.builder()
                .id(this.id)
                .biddingId(this.biddingId)
                .supplierId(this.supplierId)
                .supplierName(this.supplierName)
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .build();
        
        // 추가 속성 설정
        participation.setConfirmed(this.confirmed);
        participation.setConfirmedAt(this.confirmedAt);
        participation.setEvaluated(this.evaluated);
        participation.setEvaluationScore(this.evaluationScore);
        
        return participation;
    }
}