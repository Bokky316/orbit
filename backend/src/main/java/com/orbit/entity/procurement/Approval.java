package com.orbit.entity.procurement;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDate;

/**
 * 결재 정보를 나타내는 엔티티 클래스
 */
@Entity
@Table(name = "approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest; // 구매 요청

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private Member approver; // 승인자

    @Column(name = "approval_date")
    private LocalDate approvalDate; // 승인일

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('대기', '승인', '거절')")
    private ApprovalStatus status; // 상태 (대기, 승인, 거절)

    @Column(columnDefinition = "TEXT")
    private String comments; // 의견

    /**
     * 결재 상태를 나타내는 열거형
     */
    public enum ApprovalStatus {
        대기,
        승인,
        거절
    }
}
