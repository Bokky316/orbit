package com.orbit.repository.approval;

import com.orbit.entity.approval.ApprovalTemplateStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalTemplateStepRepository extends JpaRepository<ApprovalTemplateStep, Long> {

    // 템플릿 ID로 단계 조회 (단계 순서대로 정렬)
    List<ApprovalTemplateStep> findByTemplateIdOrderByStepAsc(Long templateId);

    // 특정 부서가 포함된 템플릿 단계 조회
    List<ApprovalTemplateStep> findByDepartmentId(Long departmentId);

    // 템플릿 ID로 단계 삭제
    @Modifying
    @Query("DELETE FROM ApprovalTemplateStep s WHERE s.template.id = :templateId")
    void deleteByTemplateId(@Param("templateId") Long templateId);
}