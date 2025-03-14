package com.orbit.repository.approval;

import com.orbit.entity.approval.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // 부서 코드로 검색 (예: HRD001)
    Optional<Department> findByCode(String code);

    // 부서 이름으로 검색 (예: "인사팀")
    Optional<Department> findByName(String name);

    // 부서 코드 존재 여부 확인
    boolean existsByCode(String code);

    // 활성화된 부서만 조회
    List<Department> findByIsActiveTrue();

    // 부서명이나 부서 코드로 검색 (검색 기능 강화)
    @Query("SELECT d FROM Department d WHERE " +
            "(LOWER(d.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "d.isActive = true")
    List<Department> searchDepartmentsByKeyword(@Param("keyword") String keyword);

    // 특정 Team Leader 레벨 이상을 가진 부서 검색 (관리 기능)
    @Query("SELECT d FROM Department d WHERE d.teamLeaderLevel >= :minLevel AND d.isActive = true")
    List<Department> findDepartmentsWithMinTeamLeaderLevel(@Param("minLevel") Integer minLevel);

    // 특정 부서와 그 하위 부서를 모두 조회 (계층 구조 관리에 필요)
    @Query("SELECT d FROM Department d WHERE d.parentDepartment.id = :parentId AND d.isActive = true")
    List<Department> findSubDepartments(@Param("parentId") Long parentId);
}