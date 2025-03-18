package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingParticipation;

public interface BiddingParticipationRepository extends JpaRepository<BiddingParticipation, Long> {

    /**
     * 특정 입찰 공고에 대한 참여 목록 조회
     */
    List<BiddingParticipation> findByBiddingId(Long biddingId);
    
    /**
     * 특정 공급사의 참여 목록 조회
     */
    List<BiddingParticipation> findBySupplierId(Long supplierId);
    
    /**
     * 특정 입찰과 공급사의 중복 참여 확인
     */
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    /**
     * 특정 입찰에서 가장 낮은 가격을 제시한 참여 조회
     */
    @Query("SELECT p FROM BiddingParticipation p WHERE p.bidding.id = :biddingId ORDER BY p.totalAmount ASC")
    List<BiddingParticipation> findLowestPriceParticipations(@Param("biddingId") Long biddingId);
    
    /**
     * 평가 대상 참여 목록 조회 (평가되지 않은 참여)
     */
    @Query("SELECT p FROM BiddingParticipation p WHERE p.bidding.id = :biddingId AND p.isEvaluated = false")
    List<BiddingParticipation> findNonEvaluatedParticipations(@Param("biddingId") Long biddingId);
    
    /**
     * 확정된 참여 목록 조회 (공급사가 참여 의사를 확정한 것)
     */
    @Query("SELECT p FROM BiddingParticipation p WHERE p.bidding.id = :biddingId AND p.isConfirmed = true")
    List<BiddingParticipation> findConfirmedParticipations(@Param("biddingId") Long biddingId);
    
    /**
     * 발주가 생성되지 않은 참여 목록 조회
     */
    @Query("SELECT p FROM BiddingParticipation p WHERE p.bidding.id = :biddingId AND p.isOrderCreated = false")
    List<BiddingParticipation> findParticipationsWithoutOrders(@Param("biddingId") Long biddingId);
    
    /**
     * 낙찰된 참여 목록 조회
     */
    @Query("SELECT p FROM BiddingParticipation p WHERE p.bidding.id = :biddingId AND p.isSelectedBidder = true")
    List<BiddingParticipation> findSelectedBidderParticipations(@Param("biddingId") Long biddingId);


    // ===== 공급자 메서드 =====
    
    // 특정 공급사의 참여 수 조회
    long countBySupplierId(Long supplierId);
    
    // 특정 입찰 및 공급사에 대한 참여 정보 조회
    Optional<BiddingParticipation> findByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
}