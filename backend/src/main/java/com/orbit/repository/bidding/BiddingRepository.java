package com.orbit.repository.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.StatusHistory;

public interface BiddingRepository extends JpaRepository<Bidding, Long> {

        @Query("SELECT b FROM Bidding b " +
       "LEFT JOIN FETCH b.purchaseRequest pr " +
       "LEFT JOIN FETCH b.purchaseRequestItem pri " +
       "LEFT JOIN FETCH pri.item i " +
       "LEFT JOIN FETCH b.suppliers s " +
       "LEFT JOIN FETCH s.supplier " +
       "WHERE b.id = :id")
Optional<Bidding> findFullById(@Param("id") Long id);




    /**
     * 상태와 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:statusChild IS NULL OR b.statusChild = :statusChild) AND " +
           "(:startDate IS NULL OR b.biddingPeriod.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.biddingPeriod.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findByStatusChildAndBiddingPeriodStartDateGreaterThanEqualAndBiddingPeriodEndDateLessThanEqual(
            @Param("statusChild") ChildCode statusChild,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:startDate IS NULL OR b.biddingPeriod.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.biddingPeriod.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findByBiddingPeriodStartDateGreaterThanEqualAndBiddingPeriodEndDateLessThanEqual(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);


         @Query("SELECT b FROM Bidding b " +
       "LEFT JOIN FETCH b.purchaseRequest pr " +
       "LEFT JOIN FETCH b.purchaseRequestItem pri " +
       "WHERE b.id = :id")
        Optional<Bidding> findByIdWithPurchaseRequest(@Param("id") Long id);

        @Query("SELECT b FROM Bidding b " +
        "LEFT JOIN FETCH b.suppliers s " +
        "WHERE b.id = :id")
        Optional<Bidding> findByIdWithSuppliers(@Param("id") Long id);

        @Query("SELECT b FROM Bidding b " +
       "LEFT JOIN FETCH b.purchaseRequest pr " +
       "LEFT JOIN FETCH b.purchaseRequestItem pri " +
       "LEFT JOIN FETCH b.suppliers s " +
       "LEFT JOIN FETCH s.supplier " +
       "WHERE b.id = :id")
        Optional<Bidding> findByIdWithPurchaseRequestAndSuppliers(@Param("id") Long id);

    /**
     * 특정 입찰 공고의 상태 변경 이력 조회
     */
    @Query("SELECT h FROM StatusHistory h WHERE h.bidding.id = :biddingId ORDER BY h.changedAt DESC")
    List<StatusHistory> findStatusHistoriesByBiddingId(@Param("biddingId") Long biddingId);
    
    /**
     * 특정 상태의 입찰 공고 목록 조회
     */
    List<Bidding> findByStatusChild(ChildCode statusChild);

    
    /**
    * 특정 공급사가 초대된 입찰 공고 목록 조회
    */
    @Query("SELECT DISTINCT b FROM Bidding b " +
       "JOIN b.suppliers s " +
       "WHERE s.supplier.id = :supplierId")
    List<Bidding> findBiddingsInvitedSupplier(@Param("supplierId") Long supplierId);
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @Query("SELECT DISTINCT b FROM Bidding b JOIN b.participations p WHERE p.supplierId = :supplierId ORDER BY b.id DESC")
    List<Bidding> findBiddingsParticipatedBySupplier(@Param("supplierId") Long supplierId);
    
    /**
     * 만료 예정인 입찰 공고 목록 조회 (종료일이 현재부터 n일 이내)
     */
    @Query("SELECT b FROM Bidding b WHERE " +
       "b.statusChild.codeValue = 'ONGOING' AND " +
       "b.biddingPeriod.endDate BETWEEN :startDate AND :endDate " +
       "ORDER BY b.biddingPeriod.endDate ASC")
        List<Bidding> findExpiringBiddings(
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate);

    /**
     * 구매 요청에 연결된 입찰 공고 목록 조회
     */
    List<Bidding> findByPurchaseRequestId(Long requestId);
    
    /**
     * 입찰 번호로 입찰 공고 조회
     */
    Bidding findByBidNumber(String bidNumber);

     // ===== 공급자 메서드 =====
    
    // 특정 공급사가 초대된 입찰 공고 중 특정 상태의 목록 조회
    @Query("SELECT DISTINCT b FROM Bidding b JOIN b.suppliers s WHERE s.supplier.id = :supplierId AND b.statusChild IN :statuses")
    List<Bidding> findBiddingsInvitedSupplierByStatuses(
            @Param("supplierId") Long supplierId, 
            @Param("statuses") List<ChildCode> statuses);
    
    // 특정 공급사가 초대된 입찰 공고 중 특정 상태의 개수 조회
    @Query("SELECT COUNT(DISTINCT b) FROM Bidding b JOIN b.suppliers s WHERE s.supplier.id = :supplierId AND b.statusChild = :status")
    long countBiddingsInvitedSupplierByStatus(
            @Param("supplierId") Long supplierId, 
            @Param("status") ChildCode status);
    
    // 특정 공급사가 낙찰받은 입찰 공고 목록 조회
        @Query("SELECT DISTINCT b FROM Bidding b " +
        "JOIN BiddingEvaluation e ON e.biddingId = b.id " +
        "WHERE e.isSelectedBidder = true " +
        "AND e.participation.supplierId = :supplierId")
        List<Bidding> findBiddingsWonBySupplier(@Param("supplierId") Long supplierId);

        // 특정 공급사가 낙찰받은 입찰 공고 개수 조회
        @Query("SELECT COUNT(b) FROM Bidding b JOIN b.participations p WHERE p.supplierId = :supplierId AND b.statusChild.codeValue = 'WON'")
long countBiddingsWonBySupplier(@Param("supplierId") Long supplierId);

    // 특정 공급사가 최근에 초대받은 입찰 공고 목록 조회 (최신순, 제한 개수)
    @Query("SELECT b FROM Bidding b " +
       "JOIN b.suppliers s " +
       "WHERE s.supplier.id = :supplierId")
List<Bidding> findRecentBiddingsInvitedSupplier(
        @Param("supplierId") Long supplierId, 
        Pageable pageable);
            
    
    // 특정 공급사가 초대받은 입찰 공고 중 특정 기간 내 마감되는 목록 조회
    @Query(value = "SELECT DISTINCT b FROM Bidding b " +
       "JOIN b.suppliers s " +
       "WHERE s.supplier.id = :supplierId " +
       "AND b.biddingPeriod.endDate BETWEEN :startDate AND :endDate " +
       "ORDER BY b.biddingPeriod.endDate ASC",
       countQuery = "SELECT COUNT(DISTINCT b) FROM Bidding b JOIN b.suppliers s WHERE s.supplier.id = :supplierId AND b.biddingPeriod.endDate BETWEEN :startDate AND :endDate")
List<Bidding> findBiddingsInvitedSupplierWithDeadlineBetween(
        @Param("supplierId") Long supplierId, 
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate,    
        Pageable pageable);


        @Query("SELECT b FROM Bidding b JOIN BiddingParticipation p ON b.id = p.bidding.id " +
       "WHERE p.supplierId = :supplierId ORDER BY p.submittedAt DESC")
List<Bidding> findRecentParticipatedBySupplier(@Param("supplierId") Long supplierId, Pageable pageable);

default List<Bidding> findRecentParticipatedBySupplier(Long supplierId, int limit) {
    return findRecentParticipatedBySupplier(supplierId, PageRequest.of(0, limit));
}

@Query("SELECT b FROM Bidding b JOIN b.participations p WHERE p.supplierId = :supplierId ORDER BY b.regTime DESC")
List<Bidding> findRecentBiddingsBySupplier(@Param("supplierId") Long supplierId, Pageable pageable);

}