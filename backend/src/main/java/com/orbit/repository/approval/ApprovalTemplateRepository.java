package com.orbit.repository.approval;

import com.orbit.entity.approval.ApprovalTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalTemplateRepository extends JpaRepository<ApprovalTemplate, Long> {

    // 활성화된 템플릿만 조회
    List<ApprovalTemplate> findByActiveTrue();

    // 이름으로 템플릿 조회
    List<ApprovalTemplate> findByNameContaining(String name);

    // 활성화된 템플릿 중 이름으로 검색
    List<ApprovalTemplate> findByActiveTrueAndNameContaining(String name);
}