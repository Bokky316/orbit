package com.orbit.dto.bidding;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.orbit.entity.bidding.BiddingEvaluation;

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
public class BiddingEvaluationDto {
    private Long id;
    private Long biddingParticipationId;
    private Long biddingId;
    private Long evaluatorId;
    private String evaluatorName;
    private String supplierName;
    private Integer priceScore;
    private Integer qualityScore;
    private Integer deliveryScore;
    private Integer reliabilityScore;
    private Integer serviceScore;
    private Integer additionalScore;
    private Integer totalScore;
    private String comment;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime selectedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime evaluatedAt;
    
    private Boolean isSelectedBidder;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime bidderSelectedAt;
    
    private Boolean selectedForOrder;

    /**
     * 엔티티로 변환
     */
    public BiddingEvaluation toEntity() {
        final Long biddingParticipationId = this.biddingParticipationId;
        final Long biddingId = this.biddingId;
        
        return BiddingEvaluation.builder()
                .id(this.id)
                .biddingParticipationId(biddingParticipationId)
                .biddingId(biddingId)
                .evaluatorId(this.evaluatorId)
                .evaluatorName(this.evaluatorName)
                .supplierName(this.supplierName)
                .priceScore(this.priceScore)
                .qualityScore(this.qualityScore)
                .deliveryScore(this.deliveryScore)
                .reliabilityScore(this.reliabilityScore)
                .serviceScore(this.serviceScore)
                .additionalScore(this.additionalScore)
                .totalScore(this.totalScore)
                .comment(this.comment)
                .selectedAt(this.selectedAt)
                .isSelectedBidder(this.isSelectedBidder)
                .bidderSelectedAt(this.bidderSelectedAt)
                .selectedForOrder(this.selectedForOrder)
                .build();
    }
    
    /**
     * 엔티티에서 DTO로 변환
     */
    public static BiddingEvaluationDto fromEntity(BiddingEvaluation entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingEvaluationDto.builder()
                .id(entity.getId())
                .biddingParticipationId(entity.getBiddingParticipationId())
                .biddingId(entity.getBiddingId())
                .evaluatorId(entity.getEvaluatorId())
                .evaluatorName(entity.getEvaluatorName())
                .supplierName(entity.getSupplierName())
                .priceScore(entity.getPriceScore())
                .qualityScore(entity.getQualityScore())
                .deliveryScore(entity.getDeliveryScore())
                .reliabilityScore(entity.getReliabilityScore())
                .serviceScore(entity.getServiceScore())
                .additionalScore(entity.getAdditionalScore())
                .totalScore(entity.getTotalScore())
                .comment(entity.getComment())
                .selectedAt(entity.getSelectedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .evaluatedAt(entity.getEvaluatedAt())
                .isSelectedBidder(entity.getIsSelectedBidder())
                .bidderSelectedAt(entity.getBidderSelectedAt())
                .selectedForOrder(entity.getSelectedForOrder())
                .build();
    }
}