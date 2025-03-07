package com.orbit.entity.procurement;

import com.orbit.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDate;

/**
 * 프로젝트 정보를 나타내는 엔티티 클래스
 * BaseEntity를 상속받아 생성자, 수정자, 생성일, 수정일을 자동 관리
 */
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    /**
     * 프로젝트의 고유 식별자
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 프로젝트 ID (예: PRJ-001)
     */
    @Column(name = "project_id", unique = true, nullable = false)
    private String projectId;

    /**
     * 프로젝트 이름
     */
    @Column(name = "project_name", nullable = false)
    private String projectName;

    /**
     * 프로젝트 담당자 이름
     */
    @Column(name = "manager_name", nullable = false)
    private String managerName;

    /**
     * 프로젝트 시작일
     */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * 프로젝트 종료일
     */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * 프로젝트 상태 (예: 진행중, 완료, 보류)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ProjectStatus status;

    /**
     * 프로젝트 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * 고객사
     */
    @Column(name = "customer")
    private String customer;

    /**
     * 사업구분 (예: SI, SM)
     */
    @Column(name = "business_type")
    private String businessType;

    /**
     * 프로젝트 예산
     */
    @Column(name = "budget")
    private Long budget;

    /**
     * 영업 담당
     */
    @Column(name = "sales_manager")
    private String salesManager;

    /**
     * 수행 PM
     */
    @Column(name = "execution_pm")
    private String executionPM;

    /**
     * 자체/통합 구매 여부
     */
    @Column(name = "is_integrated_purchase")
    private Boolean isIntegratedPurchase;

    /**
     * 비고
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * 계약 구분
     */
    @Column(name = "contract_type")
    private String contractType;

    /**
     * 등록일
     */
    @Column(name = "registration_date")
    private LocalDate registrationDate;

    /**
     * 프로젝트 상태를 나타내는 열거형
     */
    public enum ProjectStatus {
        IN_PROGRESS, // 진행중
        COMPLETED,   // 완료됨
        ON_HOLD      // 보류됨
    }
}
