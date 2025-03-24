package com.orbit.entity.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "approval_template_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalTemplateStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private ApprovalTemplate template;

    @Column(nullable = false)
    private int step;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false)
    private int minLevel;

    @Column(nullable = false)
    private int maxLevel;

    @Column(length = 200)
    private String description;

    /**
     * 이 단계에서 기안자를 결재선에 포함할지 여부를 결정합니다.
     * true로 설정하면 해당 부서/직급 조건과 관계없이 기안자가 이 단계의 결재자로 지정됩니다.
     * 기안자가 이미 다른 단계에 포함되어 있다면 이 설정은 무시됩니다.
     */
    @Column(name = "include_requester", nullable = false, columnDefinition = "boolean default false")
    private boolean includeRequester;

    // 결재자 역할 추가 (일반, 기안자, 특수 역할 등)
    @Column(name = "approver_role", length = 20)
    private String approverRole; // "REQUESTER"(기안자), "REGULAR"(일반) 등의 값을 가질 수 있음
}