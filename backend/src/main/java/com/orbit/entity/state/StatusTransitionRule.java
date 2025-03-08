package com.orbit.entity.state;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "status_transition_rules")
@Getter
@Setter
public class StatusTransitionRule {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private SystemStatus fromStatus;

    @Embedded
    private SystemStatus toStatus;

    @Enumerated(EnumType.STRING)
    private ApprovalType approvalType; // AUTO, MANUAL, CONDITIONAL

    @Column(length = 500)
    private String conditionExpression;

    public enum ApprovalType {
        AUTO,       // 자동 승인
        MANUAL,     // 수동 승인 필요
        CONDITIONAL // 조건부 승인
    }
}

