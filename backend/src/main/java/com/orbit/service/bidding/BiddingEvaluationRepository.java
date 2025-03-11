package com.orbit.repository.bidding;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingEvaluation;

public interface BiddingEvaluationRepository extends JpaRepository<BiddingEvaluation, Long> {

    /**
     * 특정 입찰 공고의 모든 평가 조회
     */
    List<BiddingEvaluation> findByBiddingId(Long biddingId);
    
    /**
     * 특정 참여에 대한 평가 조회
     */
    List<BiddingEvaluation> findByBiddingParticipationId(Long participationId);
    
    /**
     * 특정 평가자의 평가 목록 조회
     */
    List<BiddingEvaluation> findByEvaluatorId(Long evaluatorId);
    
    /**
     * 낙찰된 평가 목록 조회
     */
    List<BiddingEvaluation> findByBiddingIdAndIsSelectedBidderTrue(Long biddingId);
    
    /**
     * 발주 선정된 평가 목록 조회
     */
    List<BiddingEvaluation> findByBiddingIdAndSelectedForOrderTrue(Long biddingId);
    
    /**
     * 점수별 평가 목록 조회 (내림차순)
     */
    @Query("SELECT e FROM BiddingEvaluation e WHERE e.biddingId = :biddingId ORDER BY e.totalScore DESC")
    List<BiddingEvaluation> findTopByBiddingIdOrderByTotalScoreDesc(@Param("biddingId") Long biddingId);
    
    /**
     * 특정 공급사의 평가 목록 조회
     */
    @Query("SELECT e FROM BiddingEvaluation e JOIN BiddingParticipation p ON e.biddingParticipationId = p.id WHERE p.supplierId = :supplierId")
    List<BiddingEvaluation> findEvaluationsBySupplier(@Param("supplierId") Long supplierId);
    
    /**
     * 특정 입찰 공고에서 평가 점수가 특정 값 이상인 평가 목록 조회
     */
    @Query("SELECT e FROM BiddingEvaluation e WHERE e.biddingId = :biddingId AND e.totalScore >= :minScore ORDER BY e.totalScore DESC")
    List<BiddingEvaluation> findByBiddingIdAndMinScore(
            @Param("biddingId") Long biddingId, 
            @Param("minScore") Integer minScore);
}