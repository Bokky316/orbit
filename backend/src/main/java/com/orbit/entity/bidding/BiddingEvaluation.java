package com.orbit.entity.bidding;

import java.time.LocalDateTime;

import com.orbit.entity.BaseEntity;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.member.MemberRepository;

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

@Entity
@Table(name = "bidding_evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingEvaluation extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", insertable = false, updatable = false)
    private BiddingParticipation participation;

    @Column(name = "bidding_participation_id", nullable = false)
    private Long biddingParticipationId;

    @Column(name = "bidding_id", nullable = false)
    private Long biddingId;

    @Column(name = "evaluator_id", nullable = false)
    private Long evaluatorId;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "price_score", nullable = false)
    private Integer priceScore;

    @Column(name = "quality_score", nullable = false)
    private Integer qualityScore;

    @Column(name = "delivery_score", nullable = false)
    private Integer deliveryScore;

    @Column(name = "reliability_score", nullable = false)
    private Integer reliabilityScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt; // 평가 일시 추가

    @Column(name = "is_selected_bidder", columnDefinition = "boolean default false")
    private boolean isSelectedBidder;

    @Column(name = "bidder_selected_at")
    private LocalDateTime bidderSelectedAt;

    @Column(name = "selected_for_order", columnDefinition = "boolean default false")
    private boolean selectedForOrder;

    /**
     * 낙찰자로 선정
     * 낙찰자로 선정하고 선정 일시를 현재 시간으로 업데이트합니다.
     */
    public void selectAsBidder(NotificationRepository notificationRepo, MemberRepository memberRepo) {
        this.isSelectedBidder = true;
        this.bidderSelectedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        // 참여 정보도 낙찰자로 업데이트
        if (this.participation != null) {
            this.participation.setSelectedBidder(true);
            this.participation.setSelectedAt(LocalDateTime.now());
        }
        
        // 알림 발송은 Bidding.selectBidder 메서드에서 처리됨
    }

    /**
     * 낙찰자 선정 취소
     * 낙찰자 선정 상태와 선정 일시를 초기화합니다.
     */
    public void cancelSelectedBidder() {
        this.isSelectedBidder = false;
        this.bidderSelectedAt = null;
        this.updatedAt = LocalDateTime.now();
        
        // 참여 정보도 낙찰자 취소
        if (this.participation != null) {
            this.participation.setSelectedBidder(false);
            this.participation.setSelectedAt(null);
        }
    }
    
    /**
     * 총점 계산
     */
    private void calculateTotalScore() {
        int totalPoints = 0;
        int count = 0;
        
        if (this.priceScore != null) {
            totalPoints += this.priceScore;
            count++;
        }
        if (this.qualityScore != null) {
            totalPoints += this.qualityScore;
            count++;
        }
        if (this.deliveryScore != null) {
            totalPoints += this.deliveryScore;
            count++;
        }
        if (this.reliabilityScore != null) {
            totalPoints += this.reliabilityScore;
            count++;
        }
        
        if (count > 0) {
            this.totalScore = totalPoints / count;
        } else {
            this.totalScore = 0;
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.evaluatedAt = LocalDateTime.now(); 
        calculateTotalScore();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateTotalScore();
    }
    
   

    /**
     * 총점 계산
     * 각 점수(가격, 품질, 납품, 신뢰도)의 평균을 계산하여 총점을 설정합니다.
     */
    private void calculateTotalScore() {
        int totalPoints = 0;
        int count = 0;
        
        if (this.priceScore != null) {
            totalPoints += this.priceScore;
            count++;
        }
        if (this.qualityScore != null) {
            totalPoints += this.qualityScore;
            count++;
        }
        if (this.deliveryScore != null) {
            totalPoints += this.deliveryScore;
            count++;
        }
        if (this.reliabilityScore != null) {
            totalPoints += this.reliabilityScore;
            count++;
        }
        
        if (count > 0) {
            this.totalScore = totalPoints / count;
        } else {
            this.totalScore = 0;
        }
    }

    /**
     * 엔티티 생성 시 호출되는 메서드
     * 생성 시간, 업데이트 시간, 평가 일시를 현재 시간으로 설정하고 총점을 계산합니다.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.evaluatedAt = LocalDateTime.now(); // 평가 일시 설정
        calculateTotalScore();
    }

    /**
     * 엔티티 업데이트 시 호출되는 메서드
     * 업데이트 시간을 갱신하고 총점을 다시 계산합니다.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateTotalScore();
    }
    
   

    /**
     * 총점 계산
     * 각 점수(가격, 품질, 납품, 신뢰도)의 평균을 계산하여 총점을 설정합니다.
     */
    private void calculateTotalScore() {
        int totalPoints = 0;
        int count = 0;
        
        if (this.priceScore != null) {
            totalPoints += this.priceScore;
            count++;
        }
        if (this.qualityScore != null) {
            totalPoints += this.qualityScore;
            count++;
        }
        if (this.deliveryScore != null) {
            totalPoints += this.deliveryScore;
            count++;
        }
        if (this.reliabilityScore != null) {
            totalPoints += this.reliabilityScore;
            count++;
        }
        
        if (count > 0) {
            this.totalScore = totalPoints / count;
        } else {
            this.totalScore = 0;
        }
    }

    /**
     * 엔티티 생성 시 호출되는 메서드
     * 생성 시간, 업데이트 시간, 평가 일시를 현재 시간으로 설정하고 총점을 계산합니다.
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.evaluatedAt = LocalDateTime.now(); // 평가 일시 설정
        calculateTotalScore();
    }

    /**
     * 엔티티 업데이트 시 호출되는 메서드
     * 업데이트 시간을 갱신하고 총점을 다시 계산합니다.
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        calculateTotalScore();
    }
}