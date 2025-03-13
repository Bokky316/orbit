package com.orbit.entity.procurement;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 프로젝트 마스터 엔티티
 * - 상태 관리 시스템 통합
 * - JPA 양방향 매핑 적용
 */
@Entity
@Table(name = "projects", uniqueConstraints = {
        @UniqueConstraint(name = "uk_project_identifier", columnNames = {"project_identifier"})
})
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    //시스템 식별자 (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 비즈니스 식별자
    @Column(name = "project_identifier", nullable = false, length = 20, updatable = false)
    private String projectIdentifier;

    // 프로젝트 기본 정보
    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    // 프로젝트 유형 (기존 사업 구분)
    @Column(name = "business_category", length = 50)
    private String businessCategory;

    // 고객사
    @Column(name = "client_company", length = 200)
    private String clientCompany;

    // 계약 유형
    @Column(name = "contract_type", length = 100)
    private String contractType;

    // 요청 부서
    @Column(name = "request_department", length = 100)
    private String requestDepartment;

    // 요청자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private Member requester;

    // 예산 코드
    @Column(name = "budget_code", length = 50)
    private String budgetCode;

    // 프로젝트 예산
    @Column(name = "total_budget")
    private Long totalBudget;

    // 비고
    @Column(name = "remarks", length = 1000)
    private String remarks;

    // 프로젝트 기간
    @Embedded
    private ProjectPeriod projectPeriod;

    // 상태 관리 시스템
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "basic_status_parent_id")
    private ParentCode basicStatusParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "basic_status_child_id")
    private ChildCode basicStatusChild;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procurement_status_parent_id")
    private ParentCode procurementStatusParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "procurement_status_child_id")
    private ChildCode procurementStatusChild;

    // 구매 요청 연관 관계
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequest> purchaseRequests = new ArrayList<>();

    // 프로젝트 첨부파일 연관 관계
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectAttachment> attachments = new ArrayList<>();

    /**
     * 프로젝트 식별자 자동 생성 (PRJ-YYMM-XXX 형식)
     */
    @PrePersist
    public void generateProjectIdentifier() {
        if (this.projectIdentifier == null) {
            String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));
            String randomPart = String.format("%03d", new Random().nextInt(1000));
            this.projectIdentifier = "PRJ-" + datePart + "-" + randomPart;
        }
    }

    /**
     * 구매 요청 추가 (양방향 관계 설정)
     */
    public void addPurchaseRequest(PurchaseRequest purchaseRequest) {
        purchaseRequest.setProject(this);
        this.purchaseRequests.add(purchaseRequest);
    }

    /**
     * 첨부파일 추가 (양방향 관계 설정)
     */
    public void addAttachment(ProjectAttachment attachment) {
        attachment.setProject(this);
        this.attachments.add(attachment);
    }

    // 임베디드 타입

    /** 프로젝트 기간 */
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProjectPeriod {
        @Column(name = "start_date", nullable = false)
        private LocalDate startDate;

        @Column(name = "end_date", nullable = false)
        private LocalDate endDate;

        @AssertTrue(message = "종료일은 시작일 이후여야 합니다")
        public boolean isPeriodValid() {
            return endDate.isAfter(startDate);
        }
    }
}