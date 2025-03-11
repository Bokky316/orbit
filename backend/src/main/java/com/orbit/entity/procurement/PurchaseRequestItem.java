package com.orbit.entity.procurement;

import com.orbit.entity.item.Item;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 구매 요청 항목 정보를 나타내는 엔티티 클래스
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "purchase_request_items")
public class PurchaseRequestItem {

    /**
     * 구매 요청 항목 ID (PK).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long id;

    /**
     * 구매 요청 (FK).
     * 하나의 구매 요청 항목은 하나의 구매 요청에 속합니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest;

    /**
     * 품목 (FK).
     * 구매 요청 항목은 특정 품목을 나타냅니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;  // Item 엔티티를 참조하도록 수정

    /**
     * 수량.
     */
    @Column(nullable = false)
    private Integer quantity;

    /**
     * 단가.
     */
    @Column(nullable = false)
    private Double unitPrice;

    /**
     * 공급가액.
     */
    @Column(name = "supply_price")
    private Double supplyPrice;

    /**
     * 부가세.
     */
    private Double vat;

    /**
     * 총 금액.
     */
    @Column(name = "total_price", nullable = false)
    private Double totalPrice;

    /**
     * 품목명 (이미지에 추가적으로 보여지는 컬럼).
     * Item 엔티티에서 가져옴.
     */
    @Column(name = "item_name")
    private String itemName;

    /**
     * 사양 (이미지에 추가적으로 보여지는 컬럼).
     * Item 엔티티에서 가져옴.
     */
    @Column(name = "specification")
    private String specification;

    /**
     * 단위 (이미지에 추가적으로 보여지는 컬럼).
     * Item 엔티티에서 가져옴.
     */
    @Column(name = "unit")
    private String unit;

    /**
     * 납품 요청일 (이미지에 추가적으로 보여지는 컬럼).
     */
    @Column(name = "delivery_request_date")
    private LocalDate deliveryRequestDate;

    /**
     * 납품 장소 (이미지에 추가적으로 보여지는 컬럼).
     */
    @Column(name = "delivery_location")
    private String deliveryLocation;

    /**
     * PrePersist (저장 전 실행).
     */
    @PrePersist
    public void prePersist() {
        // Item 엔티티에서 품목명, 사양, 단위 가져와서 설정
        if (this.item != null) {
            this.itemName = this.item.getItemName();
            this.specification = this.item.getSpecification();
            this.unit = this.item.getBillingUnit(); // Item 엔티티의 billingUnit을 unit 필드에 설정
        }

        //총 금액 계산 로직 구현
        this.totalPrice = this.quantity * this.unitPrice;
    }
}
