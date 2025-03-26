package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private String companyName;
    private String businessNo;
    
    private String proposalText;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;
    private Boolean isConfirmed;
    private Boolean isEvaluated;
    private Integer evaluationScore;
    private Boolean isWinner;
    private Boolean orderCreated;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime selectedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime confirmedAt;
    
    public static BiddingParticipationDto fromEntity(BiddingParticipation entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingParticipationDto.builder()
                .id(entity.getId())
                .biddingId(entity.getBidding() != null ? entity.getBidding().getId() : null)
                .supplierId(entity.getSupplierId())
                .companyName(entity.getCompanyName())
                .businessNo(entity.getBusinessNo())
                .proposalText(entity.getProposalText())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .submittedAt(entity.getSubmittedAt())
                .isConfirmed(entity.getIsConfirmed())
                .isEvaluated(entity.getIsEvaluated())
                .evaluationScore(entity.getEvaluationScore())
                .isWinner(entity.getIsSelectedBidder())
                .orderCreated(entity.getIsOrderCreated())
                .selectedAt(entity.getSelectedAt())
                .confirmedAt(entity.getConfirmedAt())
                .build();
    }
    
    public BiddingParticipation toEntity() {
        BiddingParticipation entity = new BiddingParticipation();
        entity.setId(this.id);
        entity.setSupplierId(this.supplierId);
        entity.setCompanyName(this.companyName);
        entity.setBusinessNo(this.businessNo);
        entity.setProposalText(this.proposalText);
        entity.setUnitPrice(this.unitPrice);
        entity.setSupplyPrice(this.supplyPrice);
        entity.setVat(this.vat);
        entity.setTotalAmount(this.totalAmount);
        entity.setSubmittedAt(this.submittedAt != null ? this.submittedAt : LocalDateTime.now());
        entity.setIsConfirmed(this.isConfirmed);
        entity.setIsEvaluated(this.isEvaluated);
        entity.setEvaluationScore(this.evaluationScore);
        entity.setIsSelectedBidder(this.isWinner);
        entity.setIsOrderCreated(this.orderCreated);
        entity.setSelectedAt(this.selectedAt);
        entity.setConfirmedAt(this.confirmedAt);
        return entity;
    }
}