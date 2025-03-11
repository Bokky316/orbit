package com.orbit.entity.project;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.commonCode.SystemStatus;
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
 * - 상태 변경 이력을 포함한 모든 프로젝트 정보 관리
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

    // 기본 정보
    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Embedded
    private ProjectPeriod projectPeriod;

    @Column(name = "business_category", length = 50)
    private String businessCategory;

    @Embedded
    private ProjectManager projectManager;

    @Column(name = "total_budget")
    private Long totalBudget;

    @Column(name = "client_company", length = 100)
    private String clientCompany;

    @Column(name = "contract_type", length = 50)
    private String contractType;

    //상태 관리 시스템
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "basic_status_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "basic_status_child"))
    })
    private SystemStatus basicStatus;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "procurement_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "procurement_child"))
    })
    private SystemStatus procurementStatus;

    // 상태 변경 이력 (양방향 1:N)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StatusHistory> statusHistories = new ArrayList<>();

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
     * 상태 이력 추가 (양방향 관계 설정)
     */
    public void addStatusHistory(StatusHistory history) {
        history.setProject(this); // ✅ 반드시 호출해야 함
        this.statusHistories.add(history);
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
