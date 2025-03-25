package com.orbit.repository.procurement;

import com.orbit.entity.procurement.PurchaseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * 구매 요청 엔티티에 대한 데이터 접근 인터페이스
 */
@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long>, PurchaseRequestRepositoryCustom {

    /**
     * 상태 코드로 구매요청 목록 조회
     */
    List<PurchaseRequest> findByStatusChildCodeOrderByRequestDateDesc(String statusCode);

    /**
     * 프로젝트 ID로 구매요청 목록 조회
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.project.id = :projectId")
    List<PurchaseRequest> findByProjectId(@Param("projectId") Long projectId);

    /**
     * 모든 사업 부서 목록 조회
     */
    @Query("SELECT DISTINCT pr.businessDepartment FROM PurchaseRequest pr WHERE pr.businessDepartment IS NOT NULL")
    List<String> findAllBusinessDepartments();

    /**
     * 모든 상태 코드 목록 조회
     */
    @Query("SELECT DISTINCT pr.status.childCode FROM PurchaseRequest pr WHERE pr.status.childCode IS NOT NULL")
    List<String> findAllStatusCodes();
}