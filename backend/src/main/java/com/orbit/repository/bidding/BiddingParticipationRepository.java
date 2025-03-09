package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingEvaluation;
import com.orbit.entity.bidding.BiddingParticipation;

@Repository
public interface BiddingParticipationRepository extends JpaRepository<BiddingParticipation, Long> {
    
    List<BiddingParticipation> findByBiddingId(Long biddingId);
    
    List<BiddingParticipation> findBySupplierId(Long supplierId);
    
    Optional<BiddingParticipation> findByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    @Query("SELECT p FROM BiddingParticipation p WHERE p.biddingId = :biddingId ORDER BY p.evaluationScore DESC")
    List<BiddingParticipation> findByBiddingIdOrderByEvaluationScoreDesc(@Param("biddingId") Long biddingId);
    
    @Query("SELECT p FROM BiddingParticipation p WHERE p.biddingId = :biddingId ORDER BY p.totalAmount ASC")
    List<BiddingParticipation> findByBiddingIdOrderByTotalAmountAsc(@Param("biddingId") Long biddingId);
    
    List<BiddingParticipation> findByBiddingIdAndCreatedAtBetween(Long biddingId, LocalDateTime startDate, LocalDateTime endDate);
    
    long countByBiddingId(Long biddingId);

    Optional<BiddingEvaluation> findByBiddingParticipationId(Long participationId);
}