package com.orbit.dto.bidding;

import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingEvaluation;

import lombok.Data;

@Data
public class BiddingEvaluationDto {
    private Long id;
    private Long biddingParticipationId;
    private Long biddingId;
    private Long evaluatorId;
    private String supplierName;
    
    // 점수 항목별 상세 정보
    private Integer priceScore;       // 가격 (30%)
    private Integer qualityScore;     // 품질 (40%)
    private Integer deliveryScore;    // 납품 (20%)
    private Integer reliabilityScore; // 신뢰도 (10%)
    
    // 가중치 적용된 점수
    private Double weightedTotalScore;
    private Integer totalScore;
    
    private String comments;
    private LocalDateTime evaluatedAt;
    private boolean isSelectedBidder;
    private boolean selectedForOrder;

    // 가중치 상수
    private static final double PRICE_WEIGHT = 0.3;
    private static final double QUALITY_WEIGHT = 0.4;
    private static final double DELIVERY_WEIGHT = 0.2;
    private static final double RELIABILITY_WEIGHT = 0.1;

    // 가중치 점수 계산 메서드
    public double calculateWeightedScore() {
        if (priceScore == null || qualityScore == null || 
            deliveryScore == null || reliabilityScore == null) {
            return 0.0;
        }

        return (priceScore * PRICE_WEIGHT) +
               (qualityScore * QUALITY_WEIGHT) +
               (deliveryScore * DELIVERY_WEIGHT) +
               (reliabilityScore * RELIABILITY_WEIGHT);
    }

    // 엔티티 변환 메서드
    public BiddingEvaluation toEntity() {
        BiddingEvaluation evaluation = new BiddingEvaluation();
        evaluation.setId(this.id);
        evaluation.setBiddingParticipationId(this.biddingParticipationId);
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
        BiddingEvaluationDto dto = new BiddingEvaluationDto();
        dto.setId(evaluation.getId());
        dto.setBiddingParticipationId(evaluation.getBiddingParticipationId());
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
        
        // 총점 및 가중치 점수 계산
        dto.calculateWeightedScore();
        
        return dto;
    }
}