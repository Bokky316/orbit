package com.orbit.entity.delivery;

import com.orbit.entity.BaseTimeEntity;
import com.orbit.entity.bidding.BiddingOrder;
import com.orbit.entity.member.Member;
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

    // 관련 검수 (자동 생성)
/*    @OneToOne(mappedBy = "delivery", cascade = CascadeType.ALL, orphanRemoval = true)
    private Inspection inspection;*/

    // 비고
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // 총 금액
    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    //입고 품목
    @Column(name = "delivery_item_id", nullable = false)
    private String deliveryItemId; // 입찰 품목 ID

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

}