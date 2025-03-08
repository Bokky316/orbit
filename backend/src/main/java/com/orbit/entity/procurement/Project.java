package com.orbit.entity.procurement;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.member.Member;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * 프로젝트 마스터 정보 엔티티
 * - 프로젝트 라이프사이클 관리 핵심 엔티티
 * - 상태 관리 시스템을 통한 다단계 프로세스 지원
 */
@Entity
@Table(name = "projects", uniqueConstraints = {
        @UniqueConstraint(name = "uk_project_identifier", columnNames = {"project_identifier"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    // 고유 식별자 ------------------------------------------------------------
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 프로젝트 고유 식별 코드 (PRJ-YYMM-XXX 형식)
     * - 자동 생성 규칙: PRJ + 년월(YYMM) + 3자리 일련번호
     */
    @GeneratedValue(generator = "project-identifier")
    @GenericGenerator(name = "project-identifier",
            strategy = "com.orbit.generator.ProjectIdGenerator")
    @Column(name = "project_identifier", nullable = false, length = 20, updatable = false)
    private String projectIdentifier;

    // 기본 정보 -------------------------------------------------------------
    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Embedded
    private ProjectPeriod projectPeriod;

    @Column(name = "business_category", length = 50)
    private String businessCategory;

    @Column(name = "total_budget", precision = 15, scale = 0)
    private Long totalBudget;

    @Column(name = "client_company", length = 100)
    private String clientCompany;

    @Column(name = "contract_type", length = 50)
    private String contractType;

    // 상태 관리 시스템 -------------------------------------------------------
    /**
     * 기본 진행 상태 (등록완료/중도종결/정정등록)
     * - 데이터베이스 컬럼: basic_status_parent, basic_status_child
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "basic_status_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "basic_status_child"))
    })
    private SystemStatus basicStatus;

    /**
     * 구매 프로세스 상태 (업체선정/구매계약/검수/...)
     * - 데이터베이스 컬럼: procurement_parent, procurement_child
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "parentCode", column = @Column(name = "procurement_parent")),
            @AttributeOverride(name = "childCode", column = @Column(name = "procurement_child"))
    })
    private SystemStatus procurementStatus;

    /**
     * 상태 변경 이력 목록 (1:N 관계)
     * - CascadeType.ALL: 프로젝트 삭제시 이력 자동 삭제
     * - orphanRemoval: 이력 개체 삭제시 DB에서도 제거
     */
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StatusHistory> statusHistories = new ArrayList<>();

    /**
     * 상태 이력 추가 메서드
     * @param history 추가할 상태 이력 객체
     */
    public void addStatusHistory(StatusHistory history) {
        history.setProject(this); // 양방향 관계 설정
        this.statusHistories.add(history);
    }

    // 연관 관계 관리 --------------------------------------------------------
    @Embedded
    private ProjectManager projectManager;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    // 상태 변경 메서드 -------------------------------------------------------
    /**
     * 구매 프로세스 상태 변경
     * @param newStatus 새로운 상태 (예: PROCUREMENT-VENDOR_SELECTED)
     * @param changedBy 변경 수행 사용자
     * @throws IllegalStateException 유효하지 않은 상태 전이 시 발생
     */
    public void changeProcurementStatus(SystemStatus newStatus, Member changedBy) {
        // 1. 상태 전이 유효성 검증
        validateStatusTransition(this.procurementStatus, newStatus);

        // 2. 이력 기록 생성
        StatusHistory history = new StatusHistory();
        history.setEntityType(StatusHistory.EntityType.PROCUREMENT);
        history.setEntityId(this.id);
        history.setFromStatus(this.procurementStatus);
        history.setToStatus(newStatus);
        history.setChangedBy(changedBy);

        // 3. 상태 업데이트 및 이력 저장
        this.procurementStatus = newStatus;
        this.statusHistories.add(history);
    }

    // 내부 검증 로직 --------------------------------------------------------
    private void validateStatusTransition(SystemStatus current, SystemStatus newStatus) {
        // 실제 구현시 상태 전이 규칙 검증 로직 추가
        if (current.getParentCode().equals(newStatus.getParentCode())) {
            throw new IllegalStateException("Invalid status transition: "
                    + current.getFullCode() + " → " + newStatus.getFullCode());
        }
    }

    // 임베디드 타입 ----------------------------------------------------------

    /**
     * 프로젝트 기간 관리 임베디드 타입
     */
    @Embeddable
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ProjectPeriod {
        @Column(name = "start_date", nullable = false)
        private LocalDate startDate;

        @Column(name = "end_date", nullable = false)
        private LocalDate endDate;

        /**
         * 프로젝트 기간 유효성 검사 (시작일 < 종료일)
         */
        @AssertTrue(message = "종료일은 시작일 이후여야 합니다")
        public boolean isPeriodValid() {
            return endDate.isAfter(startDate);
        }
    }

    /**
     * 프로젝트 담당자 정보 임베디드 타입
     */
    @Embeddable
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ProjectManager {
        @Column(name = "manager_name", nullable = false, length = 50)
        private String name;

        @Column(name = "manager_contact", length = 20)
        private String contact;

        @Column(name = "manager_email", length = 100)
        private String email;
    }
}
