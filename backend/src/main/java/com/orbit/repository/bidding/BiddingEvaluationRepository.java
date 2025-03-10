package com.orbit.repository.bidding;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingEvaluation;

public interface BiddingEvaluationRepository extends JpaRepository<BiddingEvaluation, Long> {

    List<BiddingEvaluation> findByBiddingParticipationId(Long biddingParticipationId);

    @Query("SELECT e FROM BiddingEvaluation e WHERE e.participation.bidding.id = :biddingId " +
            "ORDER BY e.totalScore DESC")
    List<BiddingEvaluation> findTopByBiddingIdOrderByTotalScoreDesc(@Param("biddingId") Long biddingId);

    List<BiddingEvaluation> findByBiddingParticipationIdInOrderByTotalScoreDesc(List<Long> participationIds);


    // 입찰 ID로 모든 평가 조회
    @Query("SELECT be FROM BiddingEvaluation be JOIN be.participation bp WHERE bp.biddingId = :biddingId")
    List<BiddingEvaluation> findAllByBiddingId(@Param("biddingId") Long biddingId);

    // 공급자 ID로 모든 평가 조회
    @Query("SELECT be FROM BiddingEvaluation be JOIN be.participation bp WHERE bp.supplierId = :supplierId")
    List<BiddingEvaluation> findAllBySupplierId(@Param("supplierId") Long supplierId);

    // 전체 평가 목록 (공급자 정보 포함)
    @Query("SELECT be FROM BiddingEvaluation be JOIN FETCH be.participation bp ORDER BY be.createdAt DESC")
    List<BiddingEvaluation> findAllWithParticipation();
}
