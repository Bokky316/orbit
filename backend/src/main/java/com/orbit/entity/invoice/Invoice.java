package com.orbit.entity.invoice;

import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.delivery.Delivery;
import com.orbit.entity.member.Member;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", nullable = false, unique = true)
    private String invoiceNumber;

    // 소스 타입 - 계약 또는 입고
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false)
    private SourceType sourceType;

    // 계약 (선택적)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private BiddingContract contract;

    // 입고 (선택적)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_id")
    private Delivery delivery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Member supplier;

    // 금액 정보
    @Column(name = "supply_price", nullable = false)
    private BigDecimal supplyPrice;

    @Column(name = "vat", nullable = false)
    private BigDecimal vat;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    // 날짜 정보
    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    // 품목 정보 (입고 기반 인보이스에 필요)
    @Column(name = "item_name")
    private String itemName;

    @Column(name = "item_specification")
    private String itemSpecification;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "unit")
    private String unit;

    // 상태 정보
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InvoiceStatus status = InvoiceStatus.대기;

    // 비고
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // 생성/수정 시간
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();

        // 자동 생성 번호
        if (this.invoiceNumber == null) {
            String datePart = LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            this.invoiceNumber = "INV-" + datePart + "-" + (int)(Math.random() * 9000 + 1000);
        }

        // 기본 날짜 설정
        if (this.issueDate == null) {
            this.issueDate = LocalDate.now();
        }

        if (this.dueDate == null) {
            this.dueDate = this.issueDate.plusDays(30); // 기본 30일 지급 기한
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 송장 상태 정의
     */
    public enum InvoiceStatus {
        대기, 지불완료, 연체, 취소
    }

    /**
     * 송장 소스 타입
     */
    public enum SourceType {
        CONTRACT, DELIVERY
    }

    /**
     * 입고 기반으로 인보이스 데이터 설정
     */
    public void setFromDelivery(Delivery delivery, Member supplier) {
        this.delivery = delivery;
        this.sourceType = SourceType.DELIVERY;
        this.supplier = supplier; // 레포지토리에서 조회한 Member 객체 사용

        // 품목 정보 복사
        this.itemName = delivery.getItemName();
        this.itemSpecification = delivery.getItemSpecification();
        this.quantity = delivery.getItemQuantity();
        this.unitPrice = delivery.getItemUnitPrice();
        this.unit = delivery.getItemUnit();

        // 금액 정보 계산
        this.supplyPrice = delivery.getTotalAmount();
        this.vat = this.supplyPrice.multiply(new BigDecimal("0.1")); // 10% 부가세
        this.totalAmount = this.supplyPrice.add(this.vat);

        // 날짜 정보 설정
        this.issueDate = LocalDate.now();
        this.dueDate = this.issueDate.plusDays(30); // 기본 30일 지급 기한
    }

    /**
     * 계약 기반으로 인보이스 데이터 설정
     */
    public void setFromContract(BiddingContract contract) {
        this.contract = contract;
        this.sourceType = SourceType.CONTRACT;
        this.supplier = contract.getSupplier();

        // 금액 정보 복사
        this.supplyPrice = contract.getSupplyPrice();
        this.vat = contract.getVat();
        this.totalAmount = contract.getTotalAmount();

        // 계약 품목 정보 복사
        if (contract.getBidding() != null && contract.getBidding().getPurchaseRequestItem() != null) {
            this.itemName = contract.getBidding().getPurchaseRequestItem().getItem() != null ?
                    contract.getBidding().getPurchaseRequestItem().getItem().getName() : null;
            this.itemSpecification = contract.getBidding().getPurchaseRequestItem().getSpecification();
            this.unit = contract.getBidding().getPurchaseRequestItem().getUnitChildCode() != null ?
                    contract.getBidding().getPurchaseRequestItem().getUnitChildCode().getCodeName() : null;
        }

        this.quantity = contract.getQuantity();
        this.unitPrice = contract.getUnitPrice();
    }
}