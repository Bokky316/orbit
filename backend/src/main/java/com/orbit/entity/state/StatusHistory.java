package com.orbit.entity.state;

import com.orbit.entity.procurement.Project;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    @Column(nullable = false)
    private LocalDateTime changedAt;

    public enum EntityType {
        PROJECT, PURCHASE_REQUEST, BIDDING, CONTRACT, PAYMENT
    }

    public String getStatusChangeSummary() {
        String entityName = switch (this.entityType) { // ✅ 정상 작동
            case PROJECT -> "프로젝트";
            case PURCHASE_REQUEST -> "구매요청";
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
