package com.orbit.repository.delivery;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.orbit.entity.delivery.Delivery;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    /**
     * 입고번호로 조회
     */
    Optional<Delivery> findByDeliveryNumber(String deliveryNumber);

    /**
     * 발주 ID로 입고 목록 조회
     */
    List<Delivery> findByBiddingOrderId(Long biddingOrderId);

    /**
     * 입고일 범위로 조회
     */
    List<Delivery> findByDeliveryDateBetween(LocalDate startDate, LocalDate endDate);

    /**
     * 특정 입고일 조회
     */
    List<Delivery> findByDeliveryDate(LocalDate deliveryDate);

    /**
     * 공급업체 ID로 조회
     */
    List<Delivery> findBySupplierId(Long supplierId);

    /**
     * 발주번호로 조회
     */
    List<Delivery> findByOrderNumber(String orderNumber);

    /**
     * 조건부 검색을 위한 쿼리
     */
    @Query("SELECT d FROM Delivery d WHERE " +
            "(:deliveryNumber IS NULL OR d.deliveryNumber = :deliveryNumber) AND " +
            "(:orderNumber IS NULL OR d.orderNumber = :orderNumber) AND " +
            "(:supplierId IS NULL OR d.supplierId = :supplierId) AND " +
            "(:startDate IS NULL OR d.deliveryDate >= :startDate) AND " +
            "(:endDate IS NULL OR d.deliveryDate <= :endDate) AND " +
            "(:receiverId IS NULL OR d.receiver.id = :receiverId) AND " +
            "(:deliveryItemId IS NULL OR d.deliveryItemId = :deliveryItemId)")
    Page<Delivery> findByConditions(
            @Param("deliveryNumber") String deliveryNumber,
            @Param("orderNumber") String orderNumber,
            @Param("supplierId") Long supplierId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("receiverId") Long receiverId,
            @Param("deliveryItemId") String deliveryItemId,
            Pageable pageable
    );

    /**
     * 이번 달 입고 목록 조회
     */
    @Query("SELECT d FROM Delivery d WHERE YEAR(d.deliveryDate) = YEAR(CURRENT_DATE) AND MONTH(d.deliveryDate) = MONTH(CURRENT_DATE)")
    List<Delivery> findCurrentMonthDeliveries();

    /**
     * 발주 ID에 해당하는 입고가 있는지 확인
     */
    boolean existsByBiddingOrderId(Long biddingOrderId);

    /**
     * 입고번호 중복 확인
     */
    boolean existsByDeliveryNumber(String deliveryNumber);
}