package com.orbit.repository.bidding;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.orbit.entity.bidding.BiddingOrder;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {

    List<BiddingOrder> findAllByBiddingId(Long biddingId);
    
    List<BiddingOrder> findAllByEvaluationId(Long evaluationId);
    
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    /**
     * 특정 공급사의 발주 목록 조회
     */
    List<BiddingOrder> findBySupplierId(Long supplierId);
    
    List<BiddingOrder> findBySupplierIdAndIsSelectedBidderTrue(Long supplierId);

    
    /**
     * 승인되지 않은 발주 목록 조회
     */
    List<BiddingOrder> findByApprovedAtIsNull();
    
    
}