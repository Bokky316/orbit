package com.orbit.repository.bidding;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.orbit.entity.bidding.BiddingOrder;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {

    /**
     * 특정 입찰 공고에 대한 발주 목록 조회
     */
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    boolean existsByBiddingId(Long biddingId);
    
    boolean existsByBiddingParticipationId(Long participationId);
    
    List<BiddingOrder> findBySupplierId(Long supplierId);
    
    /**
     * 특정 납품일 범위의 발주 목록 조회
     */
    List<BiddingOrder> findByExpectedDeliveryDateBetween(
            LocalDate startDate,
            LocalDate endDate);
    
    /**
     * 승인된 발주 목록 조회
     */
    List<BiddingOrder> findByApprovedAtIsNotNull();
    
    List<BiddingOrder> findByStatus(OrderStatus status);
    
    /**
     * 특정 승인자의 발주 목록 조회
     */
    List<BiddingOrder> findByApprovalById(Long approvalById);
    
    /**
     * 특정 입찰 참여에 대한 발주 조회
     */
    List<BiddingOrder> findByBiddingParticipationId(Long participationId);
    
    /**
     * 발주 번호로 발주 조회
     */
    BiddingOrder findByOrderNumber(String orderNumber);
    
    /**
     * 특정 평가 ID와 연결된 발주 조회
     */
    List<BiddingOrder> findByEvaluationId(Long evaluationId);
    
    /**
     * 삭제되지 않은 발주 목록 조회
     */
        //     @Query("SELECT o FROM BiddingOrder o WHERE (o.deleted = false OR o.deleted IS NULL)")
        //     List<BiddingOrder> findNonDeletedOrders();
        @Query("SELECT o FROM BiddingOrder o") // deleted 필드 조건 제거
        List<BiddingOrder> findNonDeletedOrders();

    
    /**
     * 특정 기간 내에 납품 예정인 발주 중 승인된 것 조회
     */
    @Query("SELECT o FROM BiddingOrder o WHERE o.approvedAt IS NOT NULL AND " +
           "o.expectedDeliveryDate BETWEEN :startDate AND :endDate ORDER BY o.expectedDeliveryDate ASC")
    List<BiddingOrder> findApprovedOrdersByDeliveryDateBetween(
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
    
    /**
     * 특정 생성자의 발주 목록 조회
     */
    List<BiddingOrder> findByCreatedBy(String createdBy);
}