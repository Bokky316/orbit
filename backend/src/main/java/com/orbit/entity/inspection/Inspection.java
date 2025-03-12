package com.orbit.entity.inspection;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 🔍 검수(Inspection) 엔티티
 * - 계약(`contract_id`)에 대해 수행된 검수 정보를 저장
 * - 검수자는 `inspector_id`로 관리됨
 * - 검수 결과(`result`) 및 품질 상태(`quality_status`) 등을 저장
 * - 검수 관련 파일(`InspectionFile`)을 관리 (1:N 관계)
 */
@Entity
@Table(name = "inspections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 검수 ID

    @Column(name = "contract_id", nullable = false)
    private Long contractId; // 연결된 계약 ID

    @Column(name = "transaction_number", nullable = false, unique = true, length = 50)
    private String transactionNumber; // 계약 번호

    @Column(name = "supplier_name", nullable = false)
    private String supplierName; // 공급업체명

    @Column(name = "item_name", nullable = false)
    private String itemName; // 품목명

    @Column(name = "quantity", nullable = false)
    private Integer quantity; // 계약된 품목 수량

    @Column(name = "inspector_id")
    private Long inspectorId; // 검수자 ID (자동 배정)

    @Column(name = "inspection_date")
    private LocalDate inspectionDate; // 검수 수행 날짜

    @Enumerated(EnumType.STRING)
    @Column(name = "result")
    private InspectionResult result; // 검수 결과 (검수대기, 합격, 불합격 등)

    @Column(name = "comments")
    private String comments; // 검수 의견 (검수자가 남긴 코멘트)

    @Enumerated(EnumType.STRING)
    @Column(name = "quantity_status")
    private QuantityStatus quantityStatus; // 수량 상태 (정상, 부족, 초과)

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_status")
    private QualityStatus qualityStatus; // 품질 상태 (양호, 불량)

    @Enumerated(EnumType.STRING)
    @Column(name = "packaging_status")
    private PackagingStatus packagingStatus; // 포장 상태 (양호, 불량)

    @Enumerated(EnumType.STRING)
    @Column(name = "spec_match_status")
    private SpecMatchStatus specMatchStatus; // 규격 일치 여부 (일치, 불일치)

    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InspectionFile> files = new ArrayList<>(); // 검수 관련 파일 리스트 (1:N 관계)

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성 일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정 일시

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 📌 검수 결과 Enum
     * - 검수대기: 검수 대기 중
     * - 합격: 검수 통과
     * - 불합격: 검수 실패
     * - 반품요청: 반품 요청됨
     * - 재검수요청: 재검수 필요
     */
    public enum InspectionResult {
        검수대기, 합격, 불합격, 반품요청, 재검수요청
    }

    /**
     * 📌 수량 상태 Enum
     * - 정상: 수량이 계약과 일치함
     * - 부족: 계약 수량보다 적음
     * - 초과: 계약 수량보다 많음
     */
    public enum QuantityStatus {
        정상, 부족, 초과
    }

    /**
     * 📌 품질 상태 Enum
     * - 양호: 품질 이상 없음
     * - 불량: 품질 불량
     */
    public enum QualityStatus {
        양호, 불량
    }

    /**
     * 📌 포장 상태 Enum
     * - 양호: 포장 이상 없음
     * - 불량: 포장 불량
     */
    public enum PackagingStatus {
        양호, 불량
    }

    /**
     * 📌 규격 일치 여부 Enum
     * - 일치: 계약된 규격과 일치함
     * - 불일치: 계약된 규격과 다름
     */
    public enum SpecMatchStatus {
        일치, 불일치
    }
}
