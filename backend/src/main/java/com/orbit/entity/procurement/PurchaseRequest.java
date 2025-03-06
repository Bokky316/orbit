package com.orbit.entity.procurement;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 구매 요청 정보를 나타내는 엔티티 클래스
 */
@Entity
@Table(name = "purchase_requests")
@Getter
@Setter
public class PurchaseRequest extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project; // 프로젝트

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private Member requester; // 요청자

    @Column(nullable = false, length = 100)
    private String title; // 제목

    @Column(columnDefinition = "TEXT")
    private String description; // 설명

    @Column(nullable = false)
    private Double totalAmount; // 총 금액

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "ENUM('초안', '제출', '승인', '거절', '완료')")
    private PurchaseStatus status; // 상태 (초안, 제출, 승인, 거절, 완료)

    @Column(name = "request_date")
    private LocalDate requestDate; // 요청일

    @Column(name = "delivery_date")
    private LocalDate deliveryDate; // 납기일

    @OneToMany(mappedBy = "purchaseRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequestItem> purchaseRequestItems; // 구매 요청 항목 목록

    /**
     * 구매 요청 상태를 나타내는 열거형
     */
    public enum PurchaseStatus {
        초안,
        제출,
        승인,
        거절,
        대기, 완료
    }
}
