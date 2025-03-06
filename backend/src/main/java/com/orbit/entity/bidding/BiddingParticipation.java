package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//입찰 참여 

@Entity
@Table(name = "bidding_participations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingParticipation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", insertable = false, updatable = false)
    private Bidding bidding;

    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; //입찰 ID

    @Column(name = "bidding_item_id", nullable = false)
    private Long biddingItemId; //입찰 품목 ID

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; //공급자 ID

    @Column(name = "proposed_price")
    private BigDecimal proposedPrice; //제안 가격'

    @Column(name = "supply_price")
    private BigDecimal supplyPrice; //공급가액

    @Column(name = "vat")
    private BigDecimal vat; //부가세

    @Column(name = "delivery_date")
    private LocalDate deliveryDate; //예상 납기일'

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; //제안 설명

    @Column(name = "proposal_file_path", length = 500)
    private String proposalFilePath; //제안서 파일

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; //참여일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; //수정일시

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}