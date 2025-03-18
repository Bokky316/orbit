package com.orbit.repository.invoice;

import com.orbit.entity.invoice.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    // 상태 코드로 조회
    List<Invoice> findByStatusParentCodeAndStatusChildCode(String parentCode, String childCode);

    // 페이징 및 정렬을 위한 메소드
    Page<Invoice> findAll(Pageable pageable);

    // 상태별 페이징 조회
    @Query("SELECT i FROM Invoice i WHERE i.status.parentCode = :parentCode AND i.status.childCode = :childCode")
    Page<Invoice> findByStatus(
            @Param("parentCode") String parentCode,
            @Param("childCode") String childCode,
            Pageable pageable);

    // 검색어로 페이징 조회
    @Query("SELECT i FROM Invoice i WHERE " +
            "i.invoiceNumber LIKE %:searchTerm% OR " +
            "i.supplier.name LIKE %:searchTerm% OR " +
            "i.delivery.deliveryNumber LIKE %:searchTerm% OR " +
            "i.itemName LIKE %:searchTerm%")
    Page<Invoice> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    // 상태와 검색어로 페이징 조회
    @Query("SELECT i FROM Invoice i WHERE " +
            "(i.status.parentCode = :parentCode AND i.status.childCode = :childCode) AND " +
            "(i.invoiceNumber LIKE %:searchTerm% OR " +
            "i.supplier.name LIKE %:searchTerm% OR " +
            "i.delivery.deliveryNumber LIKE %:searchTerm% OR " +
            "i.itemName LIKE %:searchTerm%)")
    Page<Invoice> findByStatusAndSearchTerm(
            @Param("parentCode") String parentCode,
            @Param("childCode") String childCode,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    List<Invoice> findByDeliveryId(Long deliveryId);
}