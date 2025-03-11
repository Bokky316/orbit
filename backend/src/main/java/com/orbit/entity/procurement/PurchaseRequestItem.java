package com.orbit.entity.procurement;

import com.orbit.entity.item.Item;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "purchase_request_items")
public class PurchaseRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long id;

    // Item 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    // 단위 코드를 ParentCode, ChildCode로 변경
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_parent_code")
    private ParentCode unitParentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_child_code")
    private ChildCode unitChildCode;

    @Column(name = "specification")
    private String specification;

    @Positive(message = "수량은 0보다 커야 합니다.")
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Positive(message = "단가는 0보다 커야 합니다.")
    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 19, scale = 2)
    private BigDecimal totalPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 배송 요청 날짜
    @Column(name = "delivery_request_date")
    private LocalDate deliveryRequestDate;

    // 배송 위치
    @Column(name = "delivery_location")
    private String deliveryLocation;

    // 생성된 회원
    @Column(name = "created_by")
    private String createdBy;

    // 수정된 회원
    @Column(name = "updated_by")
    private String updatedBy;

    public void calculateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));
        } else {
            this.totalPrice = BigDecimal.ZERO;
        }
    }

    @PrePersist
    public void prePersist() {
        calculateTotalPrice();
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        calculateTotalPrice();
        this.updatedAt = LocalDateTime.now();
    }

    // 항목 복제 메서드
    public PurchaseRequestItem copy() {
        return PurchaseRequestItem.builder()
                .item(this.item)
                .unitParentCode(this.unitParentCode)
                .unitChildCode(this.unitChildCode)
                .specification(this.specification)
                .quantity(this.quantity)
                .unitPrice(this.unitPrice)
                .deliveryRequestDate(this.deliveryRequestDate)
                .deliveryLocation(this.deliveryLocation)
                .build();
    }

    // 배송 지연 여부 확인
    public boolean isDeliveryDelayed() {
        return deliveryRequestDate != null &&
                deliveryRequestDate.isBefore(LocalDate.now());
    }
}