package com.orbit.entity.bidding;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


// 입찰 평가

@Entity
@Table(name = "bidding_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingEvaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", insertable = false, updatable = false)
    private BiddingParticipation participation;

    @Column(name = "bidding_participation_id", nullable = false)
    private Long biddingParticipationId; //입찰 참여 ID

    @Column(name = "evaluator_id", nullable = false)
    private Long evaluatorId; //평가자 ID

    @Column(name = "price_score", nullable = false)
    private Integer priceScore; //가격 점수 (5점 만점)

    @Column(name = "quality_score", nullable = false)
    private Integer qualityScore; //품질 점수 (5점 만점)

    @Column(name = "delivery_score", nullable = false)
    private Integer deliveryScore; //납기 점수 (5점 만점)'

    @Column(name = "reliability_score", nullable = false)
    private Integer reliabilityScore; //신뢰도 점수 (5점 만점)

    @Column(name = "total_score", insertable = false, updatable = false)
    private Integer totalScore; //평균 점수

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments; //평가 의견

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; //평가일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; //수정일시

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}