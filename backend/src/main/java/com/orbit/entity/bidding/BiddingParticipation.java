package com.orbit.entity.bidding;

import java.math.BigDecimal;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bidding_participations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingParticipation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", nullable = false)
    private Bidding bidding;

    @Column(name = "bidding_id", insertable = false, updatable = false)
    private Long biddingId;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "unit_price", precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "supply_price", precision = 19, scale = 2)
    private BigDecimal supplyPrice;

    @Column(name = "vat", precision = 19, scale = 2)
    private BigDecimal vat;

    @Column(name = "total_amount", precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "is_confirmed", columnDefinition = "boolean default false")
    private boolean isConfirmed;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "is_evaluated", columnDefinition = "boolean default false")
    private boolean isEvaluated;

    @Column(name = "evaluation_score")
    private Integer evaluationScore;

    @Column(name = "is_order_created", columnDefinition = "boolean default false")
    private boolean isOrderCreated = false;

    /**
     * 평가 완료 상태 설정
     * @param evaluated 평가 완료 여부
     */
    public void updateEvaluationStatus(boolean evaluated) {
        this.isEvaluated = evaluated;
    }

    /**
     * 평가 점수 업데이트
     * @param score 평가 점수
     */
    public void updateEvaluationScore(Integer score) {
        this.evaluationScore = score;
    }

    /**
     * 참여 의사 확인
     */
    public void confirmParticipation() {
        this.isConfirmed = true;
        this.confirmedAt = LocalDateTime.now();
    }

    /**
     * 참여 의사 확인 취소
     */
    public void cancelParticipationConfirmation() {
        this.isConfirmed = false;
        this.confirmedAt = null;
    }

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }
}