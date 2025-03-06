package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BiddingStatus;


@Repository
public interface BiddingRepository extends JpaRepository<Bidding, Long> {
    
    @Query("SELECT b FROM Bidding b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:startDate IS NULL OR b.endDate >= :startDate) AND " +
           "(:endDate IS NULL OR b.startDate <= :endDate)")
    List<Bidding> findBiddingsByFilter(@Param("status") BiddingStatus status, 
                                     @Param("startDate") LocalDateTime startDate, 
                                     @Param("endDate") LocalDateTime endDate);
    
    List<Bidding> findByStatus(BiddingStatus status);
    
    List<Bidding> findByStartDateBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT b FROM Bidding b WHERE b.bidNumber LIKE %:keyword% OR b.title LIKE %:keyword%")
    List<Bidding> searchByKeyword(@Param("keyword") String keyword);
}