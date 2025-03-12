package com.orbit.repository.bidding;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.orbit.entity.bidding.BiddingParticipation;

@Repository
public interface BiddingParticipationRepository extends JpaRepository<BiddingParticipation, Long> {
    /**
     * 특정 입찰 공고의 모든 참여 목록 조회
     */
    List<BiddingParticipation> findByBiddingId(Long biddingId);

    /**
     * 특정 공급자의 입찰 참여 목록 조회
     */
    List<BiddingParticipation> findBySupplierId(Long supplierId);

    /**
     * 특정 입찰 공고와 공급자에 대한 참여 여부 확인
     */
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);

    /**
     * 미확정된 입찰 참여 목록 조회
     */
    List<BiddingParticipation> findByIsConfirmedFalse();

    /**
     * 확정된 입찰 참여 목록 조회
     */
    List<BiddingParticipation> findByIsConfirmedTrue();

    /**
     * 특정 입찰 공고의 확정된 참여 목록 조회
     */
    List<BiddingParticipation> findByBiddingIdAndIsConfirmedTrue(Long biddingId);

    /**
     * 평가되지 않은 입찰 참여 목록 조회
     */
    @Query("SELECT bp FROM BiddingParticipation bp WHERE bp.isEvaluated = false")
    List<BiddingParticipation> findUnevaluatedParticipations();
}