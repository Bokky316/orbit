package com.orbit.entity.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter @Setter
@Table(name = "purchase_request_items")
public class PurchaseRequestItem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long id;

    @Column(name = "item_name", nullable = false)
    @Size(max = 255, message = "품목명은 최대 255자까지 입력 가능합니다.")
    private String itemName;

    @Column(name = "specification")
    private String specification;

    @Column(name = "unit")
    private String unit;

    @Column(name = "quantity", nullable = false)
    @Positive(message = "수량은 0보다 커야 합니다.")
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    @Positive(message = "단가는 0보다 커야 합니다.")
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 19, scale = 2)
    private BigDecimal totalPrice;

    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(name = "delivery_request_date")
    private LocalDate deliveryRequestDate;

    @Column(name = "delivery_location")
    private String deliveryLocation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private GoodsRequest goodsRequest;

    public void calculateTotalPrice() {
        if (quantity != null && unitPrice != null) {
            this.totalPrice = BigDecimal.valueOf(quantity).multiply(unitPrice);
        } else {
            this.totalPrice = BigDecimal.ZERO;
        }
    }
}
