package com.orbit.repository.payment;

import com.orbit.entity.paymant.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    // 송장 ID로 결제 정보 조회
    Optional<Payment> findByInvoiceId(Long invoiceId);

    // 결제 상태별 조회 (SystemStatus 사용)
    @Query("SELECT p FROM Payment p WHERE p.method.parentCode = :parentCode AND p.method.childCode = :methodCode")
    Page<Payment> findByMethod(
            @Param("parentCode") String parentCode,
            @Param("methodCode") String methodCode,
            Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.status.parentCode = :parentCode AND p.status.childCode = :statusCode")
    Page<Payment> findByStatus(
            @Param("parentCode") String parentCode,
            @Param("statusCode") String statusCode,
            Pageable pageable);

    @Query("SELECT p FROM Payment p WHERE p.status.parentCode = :parentCode AND p.status.childCode = :childCode")
    List<Payment> findAllByStatus(@Param("parentCode") String parentCode, @Param("childCode") String childCode);

    @Query("SELECT p FROM Payment p WHERE p.method.parentCode = :parentCode AND p.method.childCode = :childCode")
    List<Payment> findAllByMethod(@Param("parentCode") String parentCode, @Param("childCode") String childCode);

    // 특정 날짜 범위 내 결제 조회
    List<Payment> findByPaymentDateBetween(LocalDate startDate, LocalDate endDate);

    // 페이징 및 정렬을 위한 메소드
    Page<Payment> findAll(Pageable pageable);

    // 검색어로 페이징 조회
    @Query("SELECT p FROM Payment p WHERE " +
            "p.transactionId LIKE %:searchTerm% OR " +
            "p.invoice.invoiceNumber LIKE %:searchTerm% OR " +
            "p.invoice.supplier.name LIKE %:searchTerm%")
    Page<Payment> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    // 결제 방법과 검색어로 페이징 조회 (SystemStatus 사용)
    @Query("SELECT p FROM Payment p WHERE " +
            "p.method.parentCode = :parentCode AND p.method.childCode = :methodCode AND " +
            "(p.transactionId LIKE %:searchTerm% OR " +
            "p.invoice.invoiceNumber LIKE %:searchTerm% OR " +
            "p.invoice.supplier.name LIKE %:searchTerm%)")
    Page<Payment> findByMethodAndSearchTerm(
            @Param("parentCode") String parentCode,
            @Param("methodCode") String methodCode,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // 결제 상태와 검색어로 페이징 조회 (SystemStatus 사용)
    @Query("SELECT p FROM Payment p WHERE " +
            "p.status.parentCode = :parentCode AND p.status.childCode = :statusCode AND " +
            "(p.transactionId LIKE %:searchTerm% OR " +
            "p.invoice.invoiceNumber LIKE %:searchTerm% OR " +
            "p.invoice.supplier.name LIKE %:searchTerm%)")
    Page<Payment> findByStatusAndSearchTerm(
            @Param("parentCode") String parentCode,
            @Param("statusCode") String statusCode,
            @Param("searchTerm") String searchTerm,
            Pageable pageable);

    // 특정 공급업체의 결제 목록 조회
    @Query("SELECT p FROM Payment p WHERE p.invoice.supplier.id = :supplierId")
    Page<Payment> findBySupplier(@Param("supplierId") Long supplierId, Pageable pageable);
}