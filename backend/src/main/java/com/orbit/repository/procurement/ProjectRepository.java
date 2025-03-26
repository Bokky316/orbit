package com.orbit.repository.procurement;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.procurement.Project;

/**
 * 프로젝트 엔티티에 대한 데이터 접근 인터페이스
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * 프로젝트 ID로 프로젝트를 조회합니다.
     * @return 조회된 프로젝트 (Optional)
     */
    Optional<Project> findByProjectIdentifier(String projectIdentifier);  // 메서드명 변경


    /**
     * 프로젝트 이름으로 프로젝트를 조회합니다.
     *
     * @param projectName 조회할 프로젝트의 이름
     * @return 조회된 프로젝트 목록
     */
    List<Project> findByProjectNameContaining(String projectName);

    /**
     * 페이징 및 정렬을 적용하여 모든 프로젝트를 조회합니다.
     *
     * @param pageable 페이징 및 정렬 정보
     * @return 페이징된 프로젝트 목록
     */
    Page<Project> findAll(Pageable pageable);

    // ProjectRepository.java에 추가할 메소드
    List<Project> findByProjectPeriodStartDateAndBasicStatusChildCodeValueNot(LocalDate startDate, String statusValue);
    List<Project> findByProjectPeriodEndDateAndBasicStatusChildCodeValueNot(LocalDate endDate, String statusValue);
}