package com.orbit.entity.approval;

import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.member.Member;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private ChildCode status;

    private LocalDateTime approvedAt;
    private String comment;

    // 결재 처리 메서드
    public void approve(String comment, ChildCode approvedStatus) {
        this.status = approvedStatus;
        this.approvedAt = LocalDateTime.now();
        this.comment = comment;
    }

    public void reject(String comment, ChildCode rejectedStatus) {
        this.status = rejectedStatus;
        this.approvedAt = LocalDateTime.now();
        this.comment = comment;
    }
}