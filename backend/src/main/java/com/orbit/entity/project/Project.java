package com.orbit.entity.project;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.approval.Department;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
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
 * 프로젝트의 기본 정보와 상태를 관리하는 엔티티 클래스입니다.
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

    // ██ 시스템 식별자 (PK) ██████████████████████████████████████████████████████████████████
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ██ 비즈니스 식별자 █████████████████████████████████████████████████████████████████████
    @Column(name = "project_identifier", nullable = false, length = 20, updatable = false)
    private String projectIdentifier;

    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Column(name = "business_category", length = 50)
    private String businessCategory;

    @Column(name = "request_department", length = 100)
    private String requestDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private Member requester;

    @Column(name = "budget_code", length = 50)
    private String budgetCode;

    // 요청자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id")
    private Member requester;

    @Column(name = "budget_code", length = 50)
    private String budgetCode;

    @Column(name = "total_budget")
    private Long totalBudget;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Embedded
    private ProjectPeriod projectPeriod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "basic_status_parent_id")
    private ParentCode basicStatusParent;

    @Embedded
    private ProjectManager projectManager;

    @Column(name = "total_budget")
    private Long totalBudget;

    @Column(name = "client_company", length = 100)
    private String clientCompany;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseRequest> purchaseRequests = new ArrayList<>();

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
     * 구매 요청을 프로젝트에 추가합니다.
     * @param purchaseRequest 추가할 구매 요청
     */
    public void addStatusHistory(StatusHistory history) {
        history.setProject(this); // ✅ 반드시 호출해야 함
        this.statusHistories.add(history);
    }

    /**
     * 첨부파일을 프로젝트에 추가합니다.
     * @param attachment 추가할 첨부파일
     */
    public void addAttachment(ProjectAttachment attachment) {
        attachment.setProject(this);
        this.attachments.add(attachment);
    }

    /**
     * 프로젝트 기간을 나타내는 임베디드 타입 클래스
     */
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

    /** 프로젝트 담당자 */
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProjectManager {
        @Column(name = "manager_name", nullable = false, length = 50)
        private String name;

        @Column(name = "manager_contact", length = 20)
        private String contact;

        @Column(name = "manager_email", length = 100)
        private String email;
    }
}
