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
    /**
     * 특정 사용자의 구매 요청 목록 조회
     * @param username 사용자 로그인 ID
     * @return 해당 사용자의 구매 요청 목록
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.member.username = :username")
    List<PurchaseRequest> findByMemberUsername(@Param("username") String username);

    /**
     * 특정 상태의 구매 요청 조회
     * @param status 상태 코드
     * @return 해당 상태의 구매 요청 목록
     */
    List<PurchaseRequest> findByStatus_ChildCode(String status);

    /**
     * 특정 사용자의 특정 상태 구매 요청 조회
     * @param username 사용자 로그인 ID
     * @param status 상태 코드
     * @return 해당 사용자의 특정 상태 구매 요청 목록
     */
    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.member.username = :username AND pr.status.childCode = :status")
    List<PurchaseRequest> findByMemberUsernameAndStatus(
            @Param("username") String username,
            @Param("status") String status
    );

    /**
     * 특정 접두사로 시작하는 요청 번호 중 가장 큰 값을 찾습니다.
     *
     * @param prefix 접두사 (예: "2405")
     * @return 발견된 최대 요청번호, 없으면 null
     */
    @Query("SELECT MAX(p.requestNumber) FROM PurchaseRequest p WHERE p.requestNumber LIKE CONCAT(:prefix, '%')")
    String findMaxRequestNumberByPrefix(@Param("prefix") String prefix);

}