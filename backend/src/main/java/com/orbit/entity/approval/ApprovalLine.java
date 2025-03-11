package com.orbit.entity.approval;

import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    public void approve(String comment) {
        this.status = ApprovalStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
        this.comment = comment;
    }

    public void reject(String comment) {
        this.status = ApprovalStatus.REJECTED;
        this.approvedAt = LocalDateTime.now();
        this.comment = comment;
    }

    public enum ApprovalStatus {
        PENDING,    // 대기 중
        IN_REVIEW,  // 검토 중(현재 단계)
        APPROVED,   // 승인
        REJECTED    // 반려
    }
}
