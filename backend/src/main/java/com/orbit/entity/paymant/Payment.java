package com.orbit.entity.paymant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.commonCode.SystemStatus;
import com.orbit.entity.invoice.Invoice;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 💰 지불(Payment) 엔티티
 * - 송장(`Invoice`)에 대한 결제 정보를 저장
 * - 하나의 송장에 대해 하나의 결제만 가능 (`OneToOne` 관계)
 */
@Entity
@Table(name = "payments", indexes = {
        @Index(name = "idx_payment_date", columnList = "payment_date"),
        @Index(name = "idx_method_child_code", columnList = "method_child_code")
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

    // 결제 상태 (SystemStatus 사용)
    @Embedded
    private SystemStatus status;

    // 결제 방법 (SystemStatus 사용)
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name="parentCode", column=@Column(name="method_parent_code")),
            @AttributeOverride(name="childCode", column=@Column(name="method_child_code"))
    })
    private SystemStatus method;

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

        // 기본 상태 설정
        if (this.status == null) {
            this.status = new SystemStatus("PAYMENT", "COMPLETED");
        }

        // 기본 결제 방법 설정
        if (this.method == null) {
            this.method = new SystemStatus("PAYMENT", "TRANSFER"); // 기본값: 계좌이체
        }
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
    public void setFromInvoice(Invoice invoice) {
        this.invoice = invoice;
        this.totalAmount = invoice.getTotalAmount();
        this.paymentDate = LocalDate.now();
        this.status = new SystemStatus("PAYMENT", "COMPLETED"); // 기본 상태: 완료
        this.method = new SystemStatus("PAYMENT", "TRANSFER"); // 기본 결제 방법: 계좌이체
        // 다른 필드는 서비스에서 설정
    }

    /**
     * 결제 방법 설정 (편의 메서드)
     * @param methodCode 결제 방법 코드 (TRANSFER, CARD, CHECK)
     */
    public void setPaymentMethodCode(String methodCode) {
        if (this.method == null) {
            this.method = new SystemStatus("PAYMENT", methodCode);
        } else {
            this.method.setChildCode(methodCode);
        }
    }
}