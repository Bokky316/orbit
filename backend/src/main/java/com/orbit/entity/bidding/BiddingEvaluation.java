package com.orbit.entity.bidding;

import java.time.LocalDateTime;

import com.orbit.constant.BiddingStatus;
import com.orbit.entity.BaseEntity;
import com.orbit.entity.member.Member;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;

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
    @JoinColumn(name = "bidding_participation_id")
    private BiddingParticipation participation;

    @Column(name = "bidding_participation_id", insertable = false, updatable = false)
    private Long biddingParticipationId;

    @Column(name = "bidding_id", insertable = false, updatable = false)
    private Long biddingId;

    @Column(name = "evaluator_id", nullable = false)
    private Long evaluatorId;
    
    @Column(name = "evaluator_name")
    private String evaluatorName;

    @Column(name = "supplier_name")
    private String supplierName;

    @Column(name = "price_score")
    private Integer priceScore;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "delivery_score")
    private Integer deliveryScore;

    @Column(name = "reliability_score")
    private Integer reliabilityScore;
    
    @Column(name = "service_score")
    private Integer serviceScore;
    
    @Column(name = "additional_score")
    private Integer additionalScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "selected_at")
    private LocalDateTime selectedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt; 

    @Column(name = "is_selected_bidder", columnDefinition = "boolean default false")
    private Boolean isSelectedBidder;

    @Column(name = "bidder_selected_at")
    private LocalDateTime bidderSelectedAt;

    @Column(name = "selected_for_order", columnDefinition = "boolean default false")
    private Boolean selectedForOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", nullable = false)
    private Bidding bidding;

    /**
     * 낙찰자로 선정
     * 낙찰자로 선정하고 선정 일시를 현재 시간으로 업데이트합니다.
     */
    public void selectAsBidder(NotificationService notificationService, MemberRepository memberRepository) {
        this.isSelectedBidder = true;
        this.bidderSelectedAt = LocalDateTime.now();
        
        // 알림 발송 로직
        try {
            // 낙찰자 선정 알림 발송
            BiddingParticipation participation = this.getParticipation();
            if (participation != null && participation.getSupplierId() != null) {
                Member supplier = memberRepository.findById(participation.getSupplierId()).orElse(null);
                if (supplier != null) {
                    NotificationRequest request = NotificationRequest.builder()
                        .type(BiddingStatus.NotificationType.BIDDING_WINNER_SELECTED)
                        .referenceId(this.getBiddingId())
                        .title("낙찰자 선정")
                        .content("귀사가 입찰에서 낙찰자로 선정되었습니다.")
                        .recipientId(supplier.getId())
                        .priority("HIGH")
                        .build();
                        
                    notificationService.sendNotification(request);
                }
            }
        } catch (Exception e) {
            // 알림 발송 실패 (로깅 필요)
            System.err.println("낙찰자 선정 알림 발송 실패: " + e.getMessage());
        }
        
        // 참여 정보도 낙찰자로 표시
        if (participation != null) {
            participation.setSelectedBidder(true);
            participation.setSelectedAt(LocalDateTime.now());
        }
    }

    /**
     * 낙찰자 선정 취소
     * 낙찰자 선정 상태와 선정 일시를 초기화합니다.
     */
    public void cancelSelectedBidder() {
        this.isSelectedBidder = false;
        this.bidderSelectedAt = null;
        
        // 참여 정보도 낙찰자 취소
        if (this.participation != null) {
            this.participation.setSelectedBidder(false);
            this.participation.setSelectedAt(null);
        }
    }
    
    /**
     * 총점 계산
     */
    // BiddingEvaluation.java
public void calculateTotalScore() {
    int totalPoints = 0;
    int count = 0;

    if (priceScore != null) { totalPoints += priceScore; count++; }
    if (qualityScore != null) { totalPoints += qualityScore; count++; }
    if (deliveryScore != null) { totalPoints += deliveryScore; count++; }
    if (reliabilityScore != null) { totalPoints += reliabilityScore; count++; }
    if (serviceScore != null) { totalPoints += serviceScore; count++; }
    if (additionalScore != null) { totalPoints += additionalScore; count++; }

    this.totalScore = count > 0 ? totalPoints / count : 0;
}


    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.evaluatedAt = LocalDateTime.now(); 
        calculateTotalScore();
        
        if (this.isSelectedBidder == null) this.isSelectedBidder = false;
        if (this.selectedForOrder == null) this.selectedForOrder = false;
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
        if (this.serviceScore != null) {
            totalPoints += this.serviceScore;
            count++;
        }
        if (this.additionalScore != null) {
            totalPoints += this.additionalScore;
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
        
        if (this.isSelectedBidder == null) this.isSelectedBidder = false;
        if (this.selectedForOrder == null) this.selectedForOrder = false;
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