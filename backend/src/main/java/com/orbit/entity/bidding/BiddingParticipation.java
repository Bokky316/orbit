package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.repository.NotificationRepository;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
public class BiddingParticipation extends BaseEntity {
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

    @Column(name = "company_name")
    private String companyName;
    
    @Column(name = "business_no")
    private String businessNo;
    
    @Column(name = "proposal_text", columnDefinition = "TEXT")
    private String proposalText;

    public Integer quantity;

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
    private Boolean isConfirmed;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "is_evaluated", columnDefinition = "boolean default false")
    private Boolean isEvaluated;

    @Column(name = "evaluation_score")
    private Integer evaluationScore;

    @Column(name = "is_order_created", columnDefinition = "boolean default false")
    private Boolean isOrderCreated;
    
    @Column(name = "is_selected_bidder", columnDefinition = "boolean default false")
    private Boolean isSelectedBidder;
    
    @Column(name = "selected_at")
    private LocalDateTime selectedAt;

    @OneToMany(mappedBy = "participation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BiddingEvaluation> evaluations = new ArrayList<>();
    
    /**
     * 평가 완료 상태 설정 (오버로딩)
     */
    public void updateEvaluationStatus(boolean evaluated) {
        this.isEvaluated = evaluated;
    }
    
    /**
     * 평가 완료 상태 설정 + 알림 발송
     */
    public void updateEvaluationStatus(boolean evaluated, Integer score, NotificationRepository notificationRepo) {
        this.isEvaluated = evaluated;
        
        if (score != null) {
            this.evaluationScore = score;
        }
        
        // 알림 발송
        if (notificationRepo != null) {
            try {
                if (getSupplierId() != null && bidding != null) {
                    // 로그만 출력
                    System.out.println("평가 완료 알림 발송 필요: supplierId=" + getSupplierId() + 
                                    ", biddingTitle=" + bidding.getTitle());
                }
            } catch (Exception e) {
                // 알림 발송 실패 (로깅 필요)
                System.err.println("평가 상태 알림 발송 실패: " + e.getMessage());
            }
        }
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
    
    /**
     * 낙찰자로 설정
     */
    public void setSelectedBidder(boolean isSelected) {
        this.isSelectedBidder = isSelected;
        if (isSelected) {
            this.selectedAt = LocalDateTime.now();
        } else {
            this.selectedAt = null;
        }
    }

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
        if (this.isConfirmed == null) this.isConfirmed = false;
        if (this.isEvaluated == null) this.isEvaluated = false;
        if (this.isOrderCreated == null) this.isOrderCreated = false;
        if (this.isSelectedBidder == null) this.isSelectedBidder = false;
    }
}