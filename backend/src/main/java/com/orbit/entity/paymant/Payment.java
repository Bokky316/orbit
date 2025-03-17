package com.orbit.entity.paymant;

import com.orbit.entity.invoice.Invoice;
import jakarta.persistence.*;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 💰 지불(Payment) 엔티티
 * - 송장(`Invoice`)에 대한 결제 정보를 저장
 * - 하나의 송장에 대해 하나의 결제만 가능 (`OneToOne` 관계)
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_date", columnList = "payment_date"),
        @Index(name = "idx_payment_method", columnList = "payment_method")
})
@Getter
@Setter
@NoArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 결제 ID

    @OneToOne
    @JoinColumn(name = "invoice_id", unique = true, nullable = false)
    private Invoice invoice; // 연결된 송장

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    @PositiveOrZero(message = "금액은 양수여야 합니다")
    private BigDecimal totalAmount; // 결제 금액

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate; // 결제 완료 날짜

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod; // 결제 방법 (계좌이체, 카드, 수표)

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.완료; // 결제 상태 (완료, 실패, 취소)

    @Column(name = "transaction_id")
    private String transactionId; // 거래 ID (은행 이체번호, 카드 결제번호 등)

    @Column(name = "notes")
    private String notes; // 결제 관련 메모

    @Column(name = "payment_details", columnDefinition = "LONGTEXT")
    private String paymentDetails; // 추가적인 결제 상세 정보 (JSON)

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; // 생성 일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정 일시

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
     * 인보이스로부터 결제 정보 생성
     */
    public void setFromInvoice(Invoice invoice) {
        this.invoice = invoice;
        this.totalAmount = invoice.getTotalAmount();
        this.paymentDate = LocalDate.now();
        // 다른 필드는 서비스에서 설정
    }

    /**
     * 💳 결제 방법 Enum
     */
    public enum PaymentMethod {
        계좌이체, 카드, 수표
    }

    /**
     * ✅ 결제 상태 Enum
     */
    public enum PaymentStatus {
        완료, 실패, 취소
    }
}