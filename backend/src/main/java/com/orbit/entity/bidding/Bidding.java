package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.AssertTrue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "biddings")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bidding extends BaseEntity {
   @Id
   @GeneratedValue(strategy = GenerationType.IDENTITY)
   private Long id;

   @Column(name = "bid_number", unique = true, nullable = false, length = 50, updatable = false)
   private String bidNumber; // 공고번호

   // ██ 기본 정보
   @Column(name = "purchase_request_id", nullable = false)
   private Long purchaseRequestId; // 구매 요청 ID

   @Column(name = "purchase_request_item_id", nullable = false)
   private Long purchaseRequestItemId; // 구매 요청 품목 ID

   @Column(name = "title", nullable = false, length = 255)
   private String title; // 입찰 제목

   @Column(name = "description", columnDefinition = "TEXT")
   private String description; // 입찰 설명

   @Column(name = "bid_method", nullable = false, length = 30)
   private String bidMethod; // 입찰방법 (String으로 변경)

   @Column(name = "start_date", nullable = false)
   private LocalDateTime startDate; // 입찰 시작일

   @Column(name = "end_date", nullable = false)
   private LocalDateTime endDate; // 입찰 마감일

   @Column(name = "conditions", columnDefinition = "TEXT")
   private String conditions; // 입찰조건

   @Column(name = "internal_note", columnDefinition = "TEXT")
   private String internalNote; // 비고(내부용)

   @Column(name = "quantity", nullable = false)
   private Integer quantity; // 수량

   // 금액 정보를 임베디드 타입으로 분리
   @Embedded
   private BiddingPrice biddingPrice;

   @Column(name = "file_path", length = 500)
   private String filePath; // 공고 파일

   
   // 상태 관리 시스템 
   @Embedded
   @AttributeOverrides({
           @AttributeOverride(name = "parentCode", column = @Column(name = "status_parent")),
           @AttributeOverride(name = "childCode", column = @Column(name = "status_child"))
   })
   private SystemStatus status; // 공고상태


   // 상태 변경 이력 (양방향 1:N)
   @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL, orphanRemoval = true)
   @Builder.Default 
   private List<StatusHistory> statusHistories = new ArrayList<>();
   

     /**
     * 금액 재계산
     */
    public void recalculatePrices() {
        if (this.biddingPrice == null) {
            this.biddingPrice = new BiddingPrice();
        }
        this.biddingPrice.recalculate(this.quantity);
    }

    /**
     * 상태 이력 추가 (양방향 관계 설정)
     */
    public void addStatusHistory(StatusHistory history) {
        history.setBidding(this); // ✅ 반드시 호출해야 함
        this.statusHistories.add(history);
    }



   /**
     * 입찰 기간 임베디드 타입
     */
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BiddingPeriod {
        @Column(name = "start_date", nullable = false)
        private LocalDateTime startDate;

        @Column(name = "end_date", nullable = false)
        private LocalDateTime endDate;

        @AssertTrue(message = "마감일은 시작일 이후여야 합니다")
        public boolean isPeriodValid() {
            return endDate != null && startDate != null && !endDate.isBefore(startDate);
        }
    }

    /**
     * 입찰 금액 정보 임베디드 타입
     */
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BiddingPrice {
        @Column(name = "unit_price")
        private BigDecimal unitPrice;

        @Column(name = "supply_price")
        private BigDecimal supplyPrice;

        @Column(name = "vat")
        private BigDecimal vat;

        @Column(name = "total_amount")
        private BigDecimal totalAmount;

        /**
         * 금액 재계산 (PriceCalculator 사용)
         */
        public void recalculate(Integer quantity) {
            if (quantity == null || unitPrice == null) {
                return;
            }
            
            // PriceCalculator 유틸리티를 사용하여 계산
            PriceCalculator.PriceResult result = 
                PriceCalculator.calculateAll(unitPrice, quantity);
            
            this.supplyPrice = result.getSupplyPrice();
            this.vat = result.getVat();
            this.totalAmount = result.getTotalAmount();
        }
    }


    /**
     * 상태 값 가져오기 (기존 코드와의 호환성 유지)
     */
    @Transient
    public BiddingStatus getStatusEnum() {
        if (this.status == null) {
            return null;
        }
        
        String childCode = this.status.getChildCode();
        if ("PENDING".equals(childCode)) {
            return BiddingStatus.대기중;
        } else if ("ONGOING".equals(childCode)) {
            return BiddingStatus.진행중;
        } else if ("CLOSED".equals(childCode)) {
            return BiddingStatus.마감;
        } else if ("CANCELED".equals(childCode)) {
            return BiddingStatus.취소;
        }
        return null;
    }

    /**
     * 상태 설정 (기존 코드와의 호환성 유지)
     */
    public void setStatusEnum(BiddingStatus status) {
        if (status == null) {
            return;
        }
        
        switch (status) {
            case 대기중 -> this.status = new SystemStatus("BIDDING", "PENDING");
            case 진행중 -> this.status = new SystemStatus("BIDDING", "ONGOING");
            case 마감 -> this.status = new SystemStatus("BIDDING", "CLOSED");
            case 취소 -> this.status = new SystemStatus("BIDDING", "CANCELED");
        }
    }

    // Enum 정의 (호환성 유지)
    public enum BidMethod {
        정가제안,
        가격제안
    }

    public enum BiddingStatus {
        대기중,
        진행중,
        마감,
        취소
    }
}