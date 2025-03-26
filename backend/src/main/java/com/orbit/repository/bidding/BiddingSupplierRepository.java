package com.orbit.repository.bidding;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingSupplier;
import com.orbit.entity.member.Member;

public interface BiddingSupplierRepository extends JpaRepository<BiddingSupplier, Long> {

    long countBySupplierId(Long supplierId); 

    /**
     * 특정 입찰 공고에 초대된 공급사 목록 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId")
    List<BiddingSupplier> findByBiddingId(@Param("biddingId") Long biddingId);
    
    /**
     * 특정 공급사가 초대된 입찰 공고 목록 조회
     */
    List<BiddingSupplier> findBySupplier(Member supplier);
    
    /**
     * 특정 입찰에 공급사가 초대되었는지 확인
     */
    boolean existsByBiddingIdAndSupplierId(Long biddingId, Long supplierId);
    
    /**
     * 특정 입찰에 초대된 특정 공급사 정보 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId AND bs.supplier.id = :supplierId")
    Optional<BiddingSupplier> findByBiddingIdAndSupplierId(@Param("biddingId") Long biddingId, @Param("supplierId") Long supplierId);
    
    /**
     * 특정 입찰에 초대된 공급사 중 알림이 발송되지 않은 공급사 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId AND (bs.notificationSent = false OR bs.notificationSent IS NULL)")
    List<BiddingSupplier> findByBiddingIdAndNotificationSentFalse(@Param("biddingId") Long biddingId);
    
    /**
     * 특정 입찰에 초대된 공급사 중 참여 의사를 밝힌 공급사 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId AND bs.isParticipating = true")
    List<BiddingSupplier> findByBiddingIdAndIsParticipatingTrue(@Param("biddingId") Long biddingId);

    /**
     * 특정 입찰에 초대된 공급사 중 참여를 거부한 공급사 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId AND bs.isRejected = true")
    List<BiddingSupplier> findByBiddingIdAndIsRejectedTrue(@Param("biddingId") Long biddingId);

    /**
     * 특정 입찰에 초대된 공급사 중 응답하지 않은 공급사 조회
     */
    @Query("SELECT bs FROM BiddingSupplier bs WHERE bs.bidding.id = :biddingId " +
          "AND (bs.isParticipating = false OR bs.isParticipating IS NULL) " +
          "AND (bs.isRejected = false OR bs.isRejected IS NULL)")
    List<BiddingSupplier> findByBiddingIdAndIsParticipatingNullAndIsRejectedNull(@Param("biddingId") Long biddingId);
}