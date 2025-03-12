package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingEvaluation;

@Repository
public interface BiddingEvaluationRepository extends JpaRepository<BiddingEvaluation, Long> {

    /**
     * 특정 입찰 공고의 모든 평가 목록 조회
     */
    List<BiddingEvaluation> findByBiddingId(Long biddingId);

    /**
     * 특정 입찰 참여에 대한 평가 조회
     */
    Optional<BiddingEvaluation> findByBiddingParticipationId(Long participationId);

    /**
     * 특정 입찰 공고의 최고 점수 평가 목록 조회
     */
    @Query("SELECT be FROM BiddingEvaluation be WHERE be.biddingId = :biddingId AND be.totalScore = (SELECT MAX(b.totalScore) FROM BiddingEvaluation b WHERE b.biddingId = :biddingId)")
    List<BiddingEvaluation> findTopByBiddingIdOrderByTotalScoreDesc(@Param("biddingId") Long biddingId);


    List<BiddingEvaluation> findBySupplierName(String supplierName);

    /**
     * 낙찰자로 선정된 모든 평가 목록 조회
     */
    List<BiddingEvaluation> findByIsSelectedBidderTrue();

    /**
     * 특정 입찰 공고의 낙찰자 평가 목록 조회
     */
    List<BiddingEvaluation> findByBiddingIdAndIsSelectedBidderTrue(Long biddingId);

    /**
     * 발주 선정된 모든 평가 목록 조회
     */
    List<BiddingEvaluation> findBySelectedForOrderTrue();

    /**
     * 특정 입찰 공고의 발주 선정 평가 목록 조회
     */
    List<BiddingEvaluation> findByBiddingIdAndSelectedForOrderTrue(Long biddingId);

    /**
     * 평가자별 평가 목록 조회
     */
    List<BiddingEvaluation> findByEvaluatorId(Long evaluatorId);

    /**
     * 특정 점수 범위 내의 평가 목록 조회
     */
    @Query("SELECT be FROM BiddingEvaluation be WHERE be.biddingId = :biddingId AND be.totalScore BETWEEN :minScore AND :maxScore")
    List<BiddingEvaluation> findByBiddingIdAndTotalScoreBetween(
            @Param("biddingId") Long biddingId, 
            @Param("minScore") Integer minScore, 
            @Param("maxScore") Integer maxScore
    );
}