package com.orbit.entity.invoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.paymant.Payment;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 📄 송장(Invoice) 엔티티
 * - 계약(`contract_id`)을 기반으로 생성됨
 * - 지불 완료 여부, 마감일, 연체 여부 등을 관리
 */
@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 송장 ID

    @Column(name = "contract_id", nullable = false)
    private Long contractId; // 연결된 계약 ID

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; // 공급업체 ID

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber; // 송장 번호 (유일 값)

    @Column(name = "supply_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal supplyAmount; // 공급가액

    @Column(name = "vat_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal vatAmount; // 부가세

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount; // 총 금액 (공급가액 + 부가세)

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate; // 송장 발행일

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate; // 결제 마감일

    @Column(name = "payment_date")
    private LocalDate paymentDate; // 결제 완료일 (지불되었을 경우)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status = InvoiceStatus.대기; // 송장 상태 (대기, 지불완료, 연체)

    @Column(name = "overdue_days", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer overdueDays; // 연체된 일수 (연체 상태일 경우)

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성 일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정 일시

    @OneToOne(mappedBy = "invoice", cascade = CascadeType.ALL)
    private Payment payment; // 연결된 결제 정보 (1:1 관계)

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * 📌 송장 상태 Enum
     */
    public enum InvoiceStatus {
        대기, 지불완료, 연체
    }
}
