package com.orbit.dto.bidding;

import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingEvaluation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingEvaluationDto {
    private Long id;
    private Long biddingParticipationId;
    private Long evaluatorId;
    private Integer priceScore;
    private Integer qualityScore;
    private Integer deliveryScore;
    private Integer reliabilityScore;
    private Integer totalScore;
    private String comments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    

     // Entity -> DTO 변환 (수정 버전)
public static BiddingEvaluationDto fromEntity(BiddingEvaluation entity) {
    return BiddingEvaluationDto.builder()
            .id(entity.getId())
            .biddingParticipationId(entity.getBiddingParticipationId())
            .evaluatorId(entity.getEvaluatorId())
            .priceScore(entity.getPriceScore())
            .qualityScore(entity.getQualityScore())
            .deliveryScore(entity.getDeliveryScore())
            .reliabilityScore(entity.getReliabilityScore())
            .totalScore(entity.getTotalScore())
            .comments(entity.getComments())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
}
    
    // DTO -> Entity 변환 (부분적으로, participation 객체는 서비스에서 설정)
    public BiddingEvaluation toEntity() {
        return BiddingEvaluation.builder()
                .id(this.id)
                .evaluatorId(this.evaluatorId)
                .priceScore(this.priceScore)
                .qualityScore(this.qualityScore)
                .deliveryScore(this.deliveryScore)
                .reliabilityScore(this.reliabilityScore)
                .totalScore(this.totalScore)
                .comments(this.comments)
                .build();
    }
}