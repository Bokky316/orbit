package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.StatusHistory;

public interface BiddingRepository extends JpaRepository<Bidding, Long> {

    /**
     * 상태와 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:statusChild IS NULL OR b.statusChild = :statusChild) AND " +
           "(:startDate IS NULL OR b.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findByStatusChildAndStartDateGreaterThanEqualAndEndDateLessThanEqual(
            @Param("statusChild") ChildCode statusChild,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:startDate IS NULL OR b.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findByStartDateGreaterThanEqualAndEndDateLessThanEqual(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

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
    @Query("SELECT DISTINCT b FROM Bidding b JOIN b.suppliers s WHERE s.supplierId = :supplierId ORDER BY b.id DESC")
    List<Bidding> findBiddingsInvitedSupplier(@Param("supplierId") Long supplierId);
    
    /**
     * 특정 공급사가 참여한 입찰 공고 목록 조회
     */
    @Query("SELECT DISTINCT b FROM Bidding b JOIN b.participations p WHERE p.supplierId = :supplierId ORDER BY b.id DESC")
    List<Bidding> findBiddingsParticipatedBySupplier(@Param("supplierId") Long supplierId);
    
    /**
     * 만료 예정인 입찰 공고 목록 조회 (종료일이 현재부터 n일 이내)
     */
    @Query("SELECT b FROM Bidding b WHERE b.statusChild.codeValue = 'ONGOING' AND b.endDate BETWEEN :now AND :expiry ORDER BY b.endDate ASC")
    List<Bidding> findExpiringBiddings(
            @Param("now") LocalDateTime now,
            @Param("expiry") LocalDateTime expiry);
    
    /**
     * 구매 요청에 연결된 입찰 공고 목록 조회
     */
    List<Bidding> findByPurchaseRequestId(Long requestId);
    
    /**
     * 입찰 번호로 입찰 공고 조회
     */
    Bidding findByBidNumber(String bidNumber);
}