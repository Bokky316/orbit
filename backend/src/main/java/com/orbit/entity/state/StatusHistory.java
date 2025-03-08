package com.orbit.entity.state;

import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.Project;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "status_histories")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHistory {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private EntityType entityType;

    private Long entityId;

    @Embedded
    private SystemStatus fromStatus;

    @Embedded
    private SystemStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private Member changedBy;

    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    public enum EntityType {
        PROJECT, PURCHASE_REQUEST, PROCUREMENT, CONTRACT
    }
}
