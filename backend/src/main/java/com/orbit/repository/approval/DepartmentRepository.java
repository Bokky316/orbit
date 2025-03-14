package com.orbit.repository.approval;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.approval.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // 부서 코드로 검색 (예: HRD001)
    Optional<Department> findByCode(String code);

    // 부서 이름으로 검색 (예: "인사팀")
    Optional<Department> findByName(String name);

    // 부서 코드 존재 여부 확인
    boolean existsByCode(String code);

    // 부서명이나 부서 코드로 검색 (검색 기능 강화)
    @Query("SELECT d FROM Department d WHERE " +
            "(LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Department> searchDepartmentsByKeyword(@Param("keyword") String keyword);

    // 특정 Team Leader 레벨 이상을 가진 부서 검색 (관리 기능)
    @Query("SELECT d FROM Department d WHERE d.teamLeaderLevel >= :minLevel")
    List<Department> findDepartmentsWithMinTeamLeaderLevel(@Param("minLevel") Integer minLevel);
}