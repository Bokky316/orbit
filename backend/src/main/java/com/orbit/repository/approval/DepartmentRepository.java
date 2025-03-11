// DepartmentRepository.java
package com.orbit.repository.approval;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    // 부서 코드로 검색 (예: HRD001)
    Optional<Department> findByCode(String code);

    // 부서 이름으로 검색 (예: "인사팀")
    Optional<Department> findByName(String name);

    // 부서 코드 존재 여부 확인
    boolean existsByCode(String code);
}
