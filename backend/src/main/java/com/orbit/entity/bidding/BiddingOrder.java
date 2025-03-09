package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "bidding_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingOrder {
    
    public enum OrderStatus {
        DRAFT, // 초안
        PENDING_APPROVAL, // 승인 대기
        APPROVED, // 승인됨
        IN_PROGRESS, // 진행 중
        COMPLETED, // 완료
        CANCELLED // 취소됨
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String orderNumber; // 발주 번호
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", insertable = false, updatable = false)
    private Bidding bidding; // 연관된 입찰
    
    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; // 입찰 ID
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", insertable = false, updatable = false)
    private BiddingParticipation biddingParticipation; // 입찰자 참여 정보
    
    @Column(name = "bidding_participation_id", nullable = false)
    private Long biddingParticipationId; // 입찰 참여 ID
    
    @Column(name = "bidding_item_id", nullable = false)
    private Long biddingItemId; // 입찰 품목 ID
    
    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; // 공급자 ID
    
    @Column(name = "supplier_name")
    private String supplierName; // 공급자명
    
    @Column(name = "is_selected_bidder", columnDefinition = "boolean default true")
    private boolean isSelectedBidder; // 낙찰자 여부
    
    @Column(name = "bidder_selected_at")
    private LocalDateTime bidderSelectedAt; // 낙찰자 선정 일시
    
    @Column(nullable = false)
    private String title; // 발주 제목
    
    @Column(columnDefinition = "TEXT")
    private String description; // 발주 설명
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity; // 수량
    
    @Column(name = "unit_price")
    private BigDecimal unitPrice; // 단가
    
    @Column(name = "supply_price")
    private BigDecimal supplyPrice; // 공급가액
    
    @Column(name = "vat")
    private BigDecimal vat; // 부가세
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount; // 총액
    
    @Column(columnDefinition = "TEXT")
    private String terms; // 계약 조건
    
    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate; // 예상 납품일
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status; // 발주 상태
    
    private Long approvedBy; // 승인자 ID
    
    private LocalDateTime approvedAt; // 승인 일시
    
    @Column(name = "created_by")
    private Long createdBy; // 생성자 ID
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성일시
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정일시
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        // 발주 생성 시 기본적으로 낙찰자로 설정
        if (this.bidderSelectedAt == null) {
            this.bidderSelectedAt = LocalDateTime.now();
        }
        this.isSelectedBidder = true;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}