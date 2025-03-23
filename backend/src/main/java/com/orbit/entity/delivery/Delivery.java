package com.orbit.entity.delivery;

import com.orbit.entity.BaseTimeEntity;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequestItem;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 입고 엔티티
 */
@Entity
@Table(name = "deliveries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Delivery extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 입고 번호 (자동 생성)
    @Column(name = "delivery_number", unique = true, nullable = false, length = 20)
    private String deliveryNumber;

    // 발주 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_order_id", nullable = false)
    private BiddingOrder biddingOrder;

    // 발주 번호 (복사)
    @Column(name = "order_number", nullable = false)
    private String orderNumber;

    // 공급업체 ID
    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    // 공급업체명
    @Column(name = "supplier_name")
    private String supplierName;

    // 실제 입고일
    @Column(name = "delivery_date", nullable = false)
    private LocalDate deliveryDate;

    // 입고 담당자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private Member receiver;

    // 비고
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // 총 금액
    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    // 품목 정보 연결
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_item_id")
    private PurchaseRequestItem purchaseRequestItem;

    // 입고 품목 ID (타입 변경: String -> Long)
    @Column(name = "delivery_item_id", nullable = false)
    private Long deliveryItemId;

    // 품목 관련 정보 (복사)
    @Column(name = "item_id")
    private String itemId;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "item_specification")
    private String itemSpecification;

    @Column(name = "item_quantity", nullable = false)
    private Integer itemQuantity;

    @Column(name = "item_unit_price", precision = 15, scale = 2)
    private BigDecimal itemUnitPrice;

    // 단위 정보
    @Column(name = "item_unit")
    private String itemUnit;

    //송장 발행 여부
    @Column(name = "invoice_issued", nullable = false)
    @Builder.Default
    private Boolean invoiceIssued = false;

    // 자동 번호 생성 및 초기화
    @PrePersist
    protected void onCreate() {
        // 현재 시간 생성 (이미 BaseEntity에서 상속)
        super.setRegTime(LocalDateTime.now());
        super.setUpdateTime(LocalDateTime.now());

        // 입고번호 생성
        if (this.deliveryNumber == null) {
            this.deliveryNumber = generateDeliveryNumber();
        }
    }

    // 입고번호 생성 메서드
    private String generateDeliveryNumber() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "DEL-" + datePart + "-" + (int)(Math.random() * 9000 + 1000);
    }

    /**
     * BiddingOrder와 PurchaseRequestItem 정보로부터 입고 정보 설정
     */
    public void setFromBiddingOrder(BiddingOrder order, PurchaseRequestItem item) {
        try {
            // 발주 정보 설정
            this.biddingOrder = order;
            this.orderNumber = order.getOrderNumber();
            this.supplierId = order.getSupplierId();
            this.supplierName = order.getSupplierName();
            this.totalAmount = order.getTotalAmount();

            // 품목 정보 설정
            if (item != null) {
                this.purchaseRequestItem = item;
                this.deliveryItemId = item.getId();  // 구매요청품목 ID를 deliveryItemId로 설정

                // item의 Item이 null이 아닌 경우에만 참조
                if (item.getItem() != null) {
                    this.itemId = item.getItem().getId();
                    this.itemName = item.getItem().getName();
                }

                this.itemSpecification = item.getSpecification();
                this.itemQuantity = item.getQuantity();
                this.itemUnitPrice = item.getUnitPrice();

                // 단위 정보가 있는 경우 설정
                if (item.getUnitChildCode() != null) {
                    this.itemUnit = item.getUnitChildCode().getCodeName();
                }
            } else if (order.getPurchaseRequestItem() != null) {
                // 발주에 연결된 구매요청품목 정보가 있는 경우 사용
                PurchaseRequestItem orderItem = order.getPurchaseRequestItem();
                this.purchaseRequestItem = orderItem;
                this.deliveryItemId = orderItem.getId();  // 구매요청품목 ID를 deliveryItemId로 설정

                if (orderItem.getItem() != null) {
                    this.itemId = orderItem.getItem().getId();
                    this.itemName = orderItem.getItem().getName();
                }

                this.itemSpecification = orderItem.getSpecification();
                this.itemQuantity = orderItem.getQuantity();
                this.itemUnitPrice = orderItem.getUnitPrice();

                if (orderItem.getUnitChildCode() != null) {
                    this.itemUnit = orderItem.getUnitChildCode().getCodeName();
                }
            } else {
                // item과 order.purchaseRequestItem 모두 null인 경우 기본값 설정
                // order로부터 가져올 수 있는 최대한의 정보를 설정
                this.deliveryItemId = order.getPurchaseRequestItemId(); // 발주의 구매요청품목 ID 사용

                if (order.getItemName() != null) {
                    this.itemName = order.getItemName();
                }

                // BiddingOrder에는 specification 필드가 없으므로 기본값으로 설정
                this.itemSpecification = "기본 규격";

                this.itemQuantity = order.getQuantity() != null ? order.getQuantity() : 0;
                this.itemUnitPrice = order.getUnitPrice();
            }
        } catch (Exception e) {
            // 오류가 발생해도 최대한 진행
            System.err.println("발주 정보 설정 중 오류 발생: " + e.getMessage());
            e.printStackTrace();  // 스택 트레이스도 출력하여 디버깅에 도움
        }
    }
}