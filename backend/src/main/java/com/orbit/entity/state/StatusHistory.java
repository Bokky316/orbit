package com.orbit.entity.state;

import java.time.LocalDateTime;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.Project;
import com.orbit.entity.procurement.PurchaseRequest;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
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

@Entity
@Table(name = "status_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "from_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "from_child"))
    })
    private SystemStatus fromStatus;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "to_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "to_child"))
    })
    private SystemStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false) // ✅ 추가된 필드
    private EntityType entityType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private Member changedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)  
    @JoinColumn(name = "bidding_id")  
    private Bidding bidding;

    @ManyToOne(fetch = FetchType.LAZY)  
    @JoinColumn(name = "bidding_contract_id")  
    private BiddingContract biddingContract;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;  // 상태 변경 이유 추가

    @Column(nullable = false)
    private LocalDateTime changedAt;

    public void setBidding(Bidding bidding) {
        this.bidding = bidding;
    }
    
    public void setBiddingContract(BiddingContract biddingContract) {
        this.biddingContract = biddingContract;
    }

    public enum EntityType {
        PROJECT, PURCHASE_REQUEST, CONTRACT, PAYMENT, BIDDING, BIDDING_CONTRACT
    }

    public String getStatusChangeSummary() {
        String entityName = switch (this.entityType) { // ✅ 정상 작동
            case PROJECT -> "프로젝트";
            case PURCHASE_REQUEST -> "구매요청";
            case BIDDING -> "입찰공고";
            case BIDDING_CONTRACT ->"입찰계약";
            default -> "기타";
        };
        return String.format("[%s → %s] %s (%s)",
                fromStatus.getFullCode(),
                toStatus.getFullCode(),
                changedBy.getUsername(),
                entityName
        );
    }

}
