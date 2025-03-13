package com.orbit.entity.commonCode;

import java.time.LocalDateTime;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상태 변경 이력 엔티티
 * - 다양한 엔티티의 상태 변경 이력을 공통으로 관리
 */
@Entity
@Table(name = "status_histories")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 엔티티 타입 (어떤 종류의 엔티티 상태가 변경되었는지)
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType entityType;
    
    // 입찰 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id")
    private Bidding bidding;
    
    // 계약 연관관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_contract_id")
    private BiddingContract biddingContract;
    
    // 매핑용 ID 필드 추가
    @Column(name = "bidding_id", insertable = false, updatable = false)
    private Long biddingId;
    
    @Column(name = "bidding_contract_id", insertable = false, updatable = false)
    private Long biddingContractId;
    
    // 변경 전 상태
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_status_id")
    private ChildCode fromStatus;
    
    // 변경 후 상태
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_status_id")
    private ChildCode toStatus;
    
    // 변경 사유
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;
    
    // 변경자 ID (Member 엔티티 참조)
    @Column(name = "changed_by_id")
    private Long changedById;
    
    // 변경 일시
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    /**
     * 엔티티 타입 열거형
     */
    public enum EntityType {
        BIDDING,         // 입찰
        CONTRACT,        // 계약
        ORDER            // 발주
    }
    
    /**
     * 계약 관련 이력 생성 편의 메서드
     */
    public static StatusHistory createContractHistory(BiddingContract contract, ChildCode fromStatus, 
                                                 ChildCode toStatus, String reason, Long changedById) {
        return StatusHistory.builder()
            .biddingContract(contract)
            .entityType(EntityType.CONTRACT)
            .fromStatus(fromStatus)
            .toStatus(toStatus)
            .reason(reason)
            .changedById(changedById)
            .changedAt(LocalDateTime.now())
            .build();
    }
}