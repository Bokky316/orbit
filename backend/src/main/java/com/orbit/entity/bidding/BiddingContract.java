package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.member.Member;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bidding_contracts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingContract extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_number", nullable = false, unique = true, length = 50)
    private String transactionNumber;

    @Column(name = "title", nullable = false)
    private String title; // 계약 제목 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", nullable = false)
    private Bidding bidding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_item_id")
    private PurchaseRequestItem purchaseRequestItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_participation_id", nullable = false)
    private BiddingParticipation biddingParticipation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Member supplier;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "delivery_date")
    private LocalDate deliveryDate;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "supply_price", precision = 19, scale = 2)
    private BigDecimal supplyPrice;

    @Column(name = "vat", precision = 19, scale = 2)
    private BigDecimal vat;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_parent_id")
    private ParentCode statusParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_child_id")
    private ChildCode statusChild;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contract_file_path")
    private String contractFilePath;

    @Column(name = "buyer_signature", columnDefinition = "TEXT")
    private String buyerSignature;

    @Column(name = "buyer_signed_at")
    private LocalDateTime buyerSignedAt;

    @Column(name = "supplier_signature", columnDefinition = "TEXT")
    private String supplierSignature;

    @Column(name = "supplier_signed_at")    
    private LocalDateTime supplierSignedAt;
    
    @OneToMany(mappedBy = "biddingContract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StatusHistory> statusHistories = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Member updatedBy;

    /**
     * 계약 금액 재계산
     */
    public void recalculatePrices() {
        if (this.unitPrice == null || this.quantity == null) {
            return;
        }
        
        // PriceCalculator 유틸리티를 사용하여 계산
        PriceCalculator.PriceResult result = 
            PriceCalculator.calculateAll(this.unitPrice, this.quantity);
        
        this.supplyPrice = result.getSupplyPrice();
        this.vat = result.getVat();
        this.totalAmount = result.getTotalAmount();
    }

    
}