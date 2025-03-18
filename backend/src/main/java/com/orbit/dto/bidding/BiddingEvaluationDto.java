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
        BiddingEvaluation evaluation = new BiddingEvaluation();
        evaluation.setId(this.id);
        // participation 관계는 서비스 레이어에서 설정
        // biddingParticipationId 필드는 양방향 매핑을 위해 유지
        evaluation.setBiddingId(this.biddingId);
        evaluation.setEvaluatorId(this.evaluatorId);
        evaluation.setSupplierName(this.supplierName);
        evaluation.setPriceScore(this.priceScore);
        evaluation.setQualityScore(this.qualityScore);
        evaluation.setDeliveryScore(this.deliveryScore);
        evaluation.setReliabilityScore(this.reliabilityScore);
        evaluation.setComments(this.comments);
        evaluation.setSelectedBidder(this.isSelectedBidder);
        evaluation.setSelectedForOrder(this.selectedForOrder);
        evaluation.setEvaluatedAt(this.evaluatedAt);
        return evaluation;
    }

    // 엔티티로부터 DTO 생성 메서드
    public static BiddingEvaluationDto fromEntity(BiddingEvaluation evaluation) {
        if (evaluation == null) return null;
        
        BiddingEvaluationDto dto = new BiddingEvaluationDto();
        dto.setId(evaluation.getId());
        // participation 객체를 통해 ID 가져오기
        dto.setBiddingParticipationId(evaluation.getParticipation() != null ? 
                                     evaluation.getParticipation().getId() : 
                                     evaluation.getBiddingParticipationId());
        dto.setBiddingId(evaluation.getBiddingId());
        dto.setEvaluatorId(evaluation.getEvaluatorId());
        dto.setSupplierName(evaluation.getSupplierName());
        dto.setPriceScore(evaluation.getPriceScore());
        dto.setQualityScore(evaluation.getQualityScore());
        dto.setDeliveryScore(evaluation.getDeliveryScore());
        dto.setReliabilityScore(evaluation.getReliabilityScore());
        dto.setComments(evaluation.getComments());
        dto.setSelectedBidder(evaluation.isSelectedBidder());
        dto.setSelectedForOrder(evaluation.isSelectedForOrder());
        dto.setEvaluatedAt(evaluation.getEvaluatedAt());
        
        // 총점 설정
        dto.setTotalScore(evaluation.getTotalScore());
        
        // 가중치 점수 계산
        dto.setWeightedTotalScore(dto.calculateWeightedScore());
        
        return dto;
    }
}