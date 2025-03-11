package com.orbit.entity.approval;

import com.orbit.entity.procurement.PurchaseRequest;
import jakarta.persistence.*;
import jdk.jfr.BooleanFlag;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "approval_lines")
public class ApprovalLine {
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private Member approver;

    @Column(nullable = false)
    private Integer step; // 결재 단계 (1,2,3...)

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    private LocalDateTime approvedAt;
    private String comment;

    // 결재 처리 메서드
    public void approve(String comment, ChildCode approvedStatus) {
        this.status = approvedStatus;
