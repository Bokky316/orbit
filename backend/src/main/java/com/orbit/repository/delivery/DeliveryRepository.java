package com.orbit.repository.delivery;

import com.orbit.entity.delivery.Delivery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {

    Optional<Delivery> findByDeliveryNumber(String deliveryNumber);

    Page<Delivery> findAllByOrderByRegTimeDesc(Pageable pageable);

    @Query("SELECT d FROM Delivery d WHERE " +
            "(:deliveryNumber IS NULL OR d.deliveryNumber LIKE %:deliveryNumber%) AND " +
            "(:orderNumber IS NULL OR d.orderNumber LIKE %:orderNumber%) AND " +
            "(:supplierId IS NULL OR d.supplierId = :supplierId) AND " +
            "(:supplierName IS NULL OR d.supplierName LIKE %:supplierName%) AND " +
            "(:startDate IS NULL OR d.deliveryDate >= :startDate) AND " +
            "(:endDate IS NULL OR d.deliveryDate <= :endDate)  AND" +
            "(:invoiceIssued IS NULL OR d.invoiceIssued = :invoiceIssued) " +
            "ORDER BY d.regTime DESC")
    Page<Delivery> searchDeliveries(
            @Param("deliveryNumber") String deliveryNumber,
            @Param("orderNumber") String orderNumber,
            @Param("supplierId") Long supplierId,
            @Param("supplierName") String supplierName,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("invoiceIssued") Boolean invoiceIssued,
            Pageable pageable);

    List<Delivery> findByBiddingOrderId(Long biddingOrderId);

    boolean existsByBiddingOrderId(Long biddingOrderId);

    /**
     * 송장 미발행 입고 목록 조회
     */
    List<Delivery> findByInvoiceIssuedFalse();
}