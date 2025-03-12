package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.orbit.entity.bidding.BiddingOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {

    List<BiddingOrder> findAllByBiddingId(Long biddingId);
    
    List<BiddingOrder> findAllByEvaluationId(Long evaluationId);
    
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    boolean existsByBiddingId(Long biddingId);
    
    boolean existsByBiddingParticipationId(Long participationId);
    
    List<BiddingOrder> findBySupplierId(Long supplierId);
    
    List<BiddingOrder> findBySupplierIdAndIsSelectedBidderTrue(Long supplierId);

    
    List<BiddingOrder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT o FROM BiddingOrder o WHERE o.bidding.id = :biddingId ORDER BY o.id ASC LIMIT 1")
    Optional<BiddingOrder> findFirstByBiddingId(Long biddingId);

    /**
     * ✅ `BiddingOrder`에서 `biddingItemId`를 통해 품목명(`item_name`)을 직접 조회
     * - `BiddingItem`과 `BiddingOrder`의 관계를 사용하여 품목명 가져오기
     */
    @Query("SELECT i.itemName FROM BiddingOrder o " +
            "JOIN BiddingItem i ON o.biddingItemId = i.id " +
            "WHERE o.id = :orderId")
    Optional<String> findItemNameByOrderId(@Param("orderId") Long orderId);
}