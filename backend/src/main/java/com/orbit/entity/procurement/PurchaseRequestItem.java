package com.orbit.entity.procurement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.eclipse.angus.mail.imap.protocol.Item;

/**
 * 구매 요청 항목 정보를 나타내는 엔티티 클래스
 */
@Entity
@Table(name = "purchase_request_items")
@Getter
@Setter
public class PurchaseRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id", nullable = false)
    private PurchaseRequest purchaseRequest; // 구매 요청

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item; // 품목

    @Column(nullable = false)
    private Integer quantity; // 수량

    @Column(nullable = false)
    private Double unitPrice; // 단가

    @Column(name = "supply_price")
    private Double supplyPrice; // 공급가액

    private Double vat; // 부가세

    @Column(name = "total_price", nullable = false)
    private Double totalPrice; // 총 금액
}
