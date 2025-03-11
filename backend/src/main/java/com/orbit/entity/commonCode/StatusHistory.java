package com.orbit.entity.code;

import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "status_history")
@Getter
@Setter
@NoArgsConstructor
public class StatusHistory {

    public enum EntityType {
        PURCHASE_REQUEST,
        PROJECT,
        CONTRACT,
        BID,
        PAYMENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EntityType entityType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "from_status_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "from_status_child"))
    })
    private com.orbit.entity.code.SystemStatus fromStatus;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "to_status_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "to_status_child"))
    })
    private com.orbit.entity.code.SystemStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private Member changedBy;

    @Column(nullable = false)
    private LocalDateTime changedAt;

    @Column(length = 500)
    private String reason;

    @PrePersist
    public void prePersist() {
        this.changedAt = LocalDateTime.now();
    }
}