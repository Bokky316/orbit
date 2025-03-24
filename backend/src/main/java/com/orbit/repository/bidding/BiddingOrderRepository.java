package com.orbit.repository.bidding;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.bidding.BiddingOrder;

public interface BiddingOrderRepository extends JpaRepository<BiddingOrder, Long> {

    /**
     * 특정 입찰 공고에 대한 발주 목록 조회
     */
    List<BiddingOrder> findByBiddingId(Long biddingId);
    
    /**
     * 특정 공급사의 발주 목록 조회
     */
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
    
    /**
     * 승인되지 않은 발주 목록 조회
     */
    List<BiddingOrder> findByApprovedAtIsNull();
    
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

    @Query("SELECT bo FROM BiddingOrder bo WHERE bo.approvedAt IS NULL AND bo.id NOT IN (SELECT d.biddingOrder.id FROM Delivery d)")
    List<BiddingOrder> findUnapprovedAndUnreceivedOrders();

    /**
     * 월별 구매 통계 조회
     */
    @Query(value = """
    SELECT 
            DATE_FORMAT(bo.reg_time, '%Y-%m') AS yearMonth,
            COUNT(bo.id) AS orderCount,
            SUM(bo.total_amount) AS totalAmount
    FROM bidding_orders bo
    WHERE bo.reg_time BETWEEN CAST(:startDate AS DATETIME) AND CAST(:endDate AS DATETIME)
    GROUP BY DATE_FORMAT(bo.reg_time, '%Y-%m')
    ORDER BY yearMonth
    """, nativeQuery = true)
    List<Object[]> findMonthlyOrderStatistics(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 카테고리별 구매 통계 조회
     */
    @Query(value = """
        SELECT
             c.category_name AS category,
             COUNT(bo.id) AS orderCount,
             SUM(bo.total_amount) AS totalAmount
        FROM bidding_orders bo
        JOIN purchase_request_items pri ON bo.purchase_request_item_id = pri.purchase_request_item_id
        JOIN item i ON pri.item_id = i.item_id
        JOIN category c ON i.category_id = c.category_id
        WHERE bo.reg_time BETWEEN CAST(:startDate AS DATETIME) AND CAST(:endDate AS DATETIME)
        GROUP BY c.category_name
        ORDER BY totalAmount DESC
        """, nativeQuery = true)
    List<Object[]> findCategoryOrderStatistics(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 품목별 구매 통계 조회
     */
    @Query(value = """
        SELECT 
            i.item_name AS item,
            COUNT(bo.id) AS orderCount,
            SUM(bo.total_amount) AS totalAmount
        FROM bidding_orders bo
        JOIN purchase_request_items pri ON bo.purchase_request_item_id = pri.purchase_request_item_id
        JOIN item i ON pri.item_id = i.item_id
        WHERE bo.reg_time BETWEEN CAST(:startDate AS DATETIME) AND CAST(:endDate AS DATETIME)
        GROUP BY i.item_name
        ORDER BY totalAmount DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findItemOrderStatistics(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );


    /**
     * 공급업체별 구매 통계 조회
     */
    @Query(value = """
        SELECT 
            bo.supplier_id AS supplierId,
            bo.supplier_name AS supplierName,
            SUM(bo.total_amount) AS totalAmount
        FROM bidding_orders bo
        WHERE bo.reg_time BETWEEN CAST(:startDate AS DATETIME) AND CAST(:endDate AS DATETIME)
        GROUP BY bo.supplier_id, bo.supplier_name
        ORDER BY totalAmount DESC
        """, nativeQuery = true)
    List<Object[]> findSupplierOrderStatistics(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );


}