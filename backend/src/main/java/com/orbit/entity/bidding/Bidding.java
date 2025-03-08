package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "biddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bidding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bid_number", unique = true, nullable = false, length = 50)
    private String bidNumber; //공고번호

    @Column(name = "purchase_request_id", nullable = false)
    private Long purchaseRequestId; //구매 요청 ID

    @Column(name = "purchase_request_item_id", nullable = false)
    private Long purchaseRequestItemId; //구매 요청 품목 ID

    @Column(name = "title", nullable = false, length = 255)
    private String title; //입찰 제목

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; //입찰 설명'

    @Enumerated(EnumType.STRING)
    @Column(name = "bid_method", nullable = false)
    private BidMethod bidMethod; //입찰방법

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate; //입찰 시작일

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate; //입찰 마감일

    @Column(name = "conditions", columnDefinition = "TEXT")
    private String conditions; //입찰조건

    @Column(name = "internal_note", columnDefinition = "TEXT")
    private String internalNote; //비고(내부용)

    @Column(name = "quantity", nullable = false)
    private Integer quantity; //수량

    @Column(name = "unit_price")
    private BigDecimal unitPrice; //입찰 단가

    @Column(name = "supply_price")
    private BigDecimal supplyPrice; //입찰 공급가액

    @Column(name = "vat")
    private BigDecimal vat;//입찰 부가세

    @Column(name = "total_amount")
    private BigDecimal totalAmount; //총금액

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BiddingStatus status; //공고상태

    @Column(name = "file_path", length = 500)
    private String filePath; //공고 파일

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; //생성일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; //수정일시

    @Column(name = "created_by", nullable = false)
    private Long createdBy; //최초작성자 ID

    @Column(name = "updated_by")
    private Long updatedBy; //최종수정자 ID

    public enum BidMethod {
        정가제안, 가격제안
    }

    public enum BiddingStatus {
        대기중, 오픈, 마감, 취소
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = BiddingStatus.대기중;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}