package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingSupplier;

public interface BiddingSupplierRepository extends JpaRepository<BiddingSupplier, Long> {

    /**
     * 특정 입찰 공고에 초대된 공급사 목록 조회
     */
    List<BiddingSupplier> findByBiddingId(Long biddingId);
    
    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    List<BiddingSupplier> findBySupplierId(Long supplierId);
    
    /**
     * 특정 입찰과 공급사 ID로 조회
     */
    Optional<BiddingSupplier> findByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    /**
     * 특정 입찰에 공급사가 초대되었는지 확인
     */
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    /**
     * 특정 입찰에 초대된 공급사 중 알림이 발송되지 않은 공급사 조회
     */
    @Query("SELECT s FROM BiddingSupplier s WHERE s.biddingId = :biddingId AND (s.notificationSent = false OR s.notificationSent IS NULL)")
    List<BiddingSupplier> findNonNotifiedSuppliers(@Param("biddingId") Long biddingId);
    
    /**
     * 특정 입찰에 초대된 공급사 중 참여 의사를 밝힌 공급사 조회
     */
    @Query("SELECT s FROM BiddingSupplier s WHERE s.biddingId = :biddingId AND s.isParticipating = true")
    List<BiddingSupplier> findParticipatingSuppliers(@Param("biddingId") Long biddingId);

    /**
     * 특정 입찰에 초대된 공급사 중 참여를 거부한 공급사 조회
     */
    @Query("SELECT s FROM BiddingSupplier s WHERE s.biddingId = :biddingId AND s.isRejected = true")
    List<BiddingSupplier> findRejectedSuppliers(@Param("biddingId") Long biddingId);

    /**
     * 특정 입찰에 초대된 공급사 중 응답하지 않은 공급사 조회
     */
   @Query("SELECT s FROM BiddingSupplier s WHERE s.biddingId = :biddingId " +
   "AND (s.isParticipating = false OR s.isParticipating IS NULL) " +
   "AND (s.isRejected = false OR s.isRejected IS NULL)")
    List<BiddingSupplier> findNonRespondedSuppliers(@Param("biddingId") Long biddingId);

}