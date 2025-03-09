package com.orbit.repository.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.bidding.BiddingOrder.OrderStatus;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {
    
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    boolean existsByBiddingId(Long biddingId);
    
    boolean existsByBiddingParticipationId(Long participationId);
    
    List<BiddingOrder> findBySupplierId(Long supplierId);
    
    List<BiddingOrder> findBySupplierIdAndIsSelectedBidderTrue(Long supplierId);
    
    List<BiddingOrder> findByStatus(OrderStatus status);
    
    List<BiddingOrder> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT SUM(o.totalAmount) FROM BiddingOrder o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.status = :status")
    BigDecimal sumTotalAmountByCreatedAtBetweenAndStatus(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate,
            @Param("status") OrderStatus status);
    
    @Query("SELECT SUM(o.totalAmount) FROM BiddingOrder o WHERE o.createdAt BETWEEN :startDate AND :endDate AND o.status = :status AND o.isSelectedBidder = true")
    BigDecimal sumTotalAmountByCreatedAtBetweenAndStatusAndIsSelectedBidderTrue(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate,
            @Param("status") OrderStatus status);
}