package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;

public interface BiddingRepository extends JpaRepository<Bidding, Long> {

    /**
     * 상태와 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:startDate IS NULL OR b.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findBiddingsByFilter(
            @Param("status") SystemStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 날짜 범위로 입찰 공고 필터링
     */
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:startDate IS NULL OR b.startDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.endDate <= :endDate) " +
           "ORDER BY b.id DESC")
    List<Bidding> findBiddingsByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * 특정 입찰 공고의 상태 변경 이력 조회
     */
    @Query("SELECT h FROM StatusHistory h WHERE h.bidding.id = :biddingId ORDER BY h.changedAt DESC")
    List<StatusHistory> findStatusHistoriesByBiddingId(@Param("biddingId") Long biddingId);
}