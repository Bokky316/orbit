package com.orbit.repository.bidding;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingEvaluation;

@Repository
public interface BiddingEvaluationRepository extends JpaRepository<BiddingEvaluation, Long> {
    
    List<BiddingEvaluation> findByBiddingParticipationId(Long biddingParticipationId);
    
    @Query("SELECT e FROM BiddingEvaluation e WHERE e.participation.bidding.id = :biddingId " +
           "ORDER BY e.totalScore DESC")
    List<BiddingEvaluation> findTopByBiddingIdOrderByTotalScoreDesc(@Param("biddingId") Long biddingId);
    
    List<BiddingEvaluation> findByBiddingParticipationIdInOrderByTotalScoreDesc(List<Long> participationIds);
}
