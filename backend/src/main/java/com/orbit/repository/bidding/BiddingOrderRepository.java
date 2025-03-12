package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.orbit.entity.bidding.BiddingOrder;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {

    List<BiddingOrder> findAllByBiddingId(Long biddingId);
    
    List<BiddingOrder> findAllByEvaluationId(Long evaluationId);
    
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    boolean existsByBiddingId(Long biddingId);
    
    boolean existsByBiddingParticipationId(Long participationId);
    
    List<BiddingOrder> findBySupplierId(Long supplierId);
    
    List<BiddingOrder> findBySupplierIdAndIsSelectedBidderTrue(Long supplierId);

    
    List<BiddingOrder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    
}