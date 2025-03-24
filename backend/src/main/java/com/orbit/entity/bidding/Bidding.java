package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.orbit.entity.BaseEntity;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.commonCode.StatusHistory;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;
import com.orbit.util.PriceCalculator;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
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
    
    @Column(name = "bid_number", unique = true, nullable = false, length = 50)
    private String bidNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String conditions;

    private String internalNote;

    @Embedded
    private BiddingPeriod biddingPeriod;

    private Integer quantity;

    @Column(precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 19, scale = 2)
    private BigDecimal supplyPrice;

    @Column(precision = 19, scale = 2)
    private BigDecimal vat;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "closed_at")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closedAt;

    @Column(name = "closed_by", length = 50)
    private String closedBy;

    // Lazy Loading 최적화 및 Jackson 직렬화 설정
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_item_id")
    private PurchaseRequestItem purchaseRequestItem;

    // 상태 및 방식 관리
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_parent_id")
    private ParentCode statusParent;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_child_id")
    private ChildCode statusChild;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "method_parent_id")
    private ParentCode methodParent;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "method_child_id")
    private ChildCode methodChild;

    // 연관관계 관리
    @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BiddingSupplier> suppliers = new ArrayList<>();

    @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BiddingParticipation> participations = new ArrayList<>();

    @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StatusHistory> statusHistories = new ArrayList<>();

    @OneToMany(mappedBy = "bidding", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BiddingEvaluation> evaluations = new ArrayList<>();


    @ElementCollection
    @CollectionTable(name = "bidding_attachments", joinColumns = @JoinColumn(name = "bidding_id"))
    @Column(name = "file_path")
    @Builder.Default
    private List<String> attachmentPaths = new ArrayList<>();

    // 비즈니스 로직 메서드들
    public void recalculatePrices() {
        if (this.unitPrice != null && this.purchaseRequestItem != null) {
            PriceCalculator.PriceResult result = 
                PriceCalculator.calculateAll(this.unitPrice, this.purchaseRequestItem.getQuantity());
            
            this.supplyPrice = result.getSupplyPrice();
            this.vat = result.getVat();
            this.totalAmount = result.getTotalAmount();
        }
    }

    public void addSupplier(BiddingSupplier supplier) {
        if (this.suppliers == null) {
            this.suppliers = new ArrayList<>();
        }
        this.suppliers.add(supplier);
        supplier.setBidding(this);
    }

    public void addParticipation(BiddingParticipation participation) {
        if (this.participations == null) {
            this.participations = new ArrayList<>();
        }
        this.participations.add(participation);
        participation.setBidding(this);
    }

    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class BiddingPeriod {
        @Column(name = "start_date")
        private LocalDate startDate;

        @Column(name = "end_date")
        private LocalDate endDate;

        @AssertTrue(message = "종료일은 시작일 이후여야 합니다")
        public boolean isPeriodValid() {
            return endDate != null && startDate != null && endDate.isAfter(startDate);
        }
    }

    // 상태 변경 및 알림 메서드 
    public void changeStatus(
        ChildCode newStatus, 
        String reason, 
        Long changedById, 
        MemberRepository memberRepository, 
        NotificationService notificationService
    ) {
        try {
            // 상태 변경 로직 구현
            StatusHistory history = StatusHistory.builder()
                .bidding(this)
                .entityType(StatusHistory.EntityType.BIDDING)
                .fromStatus(this.statusChild)
                .toStatus(newStatus)
                .reason(reason)
                .changedById(changedById)
                .changedAt(LocalDateTime.now())
                .build();
            
            this.statusHistories.add(history);
            this.statusChild = newStatus;

        } catch (Exception e) {
            // 로깅 및 예외 처리
            throw new RuntimeException("상태 변경 중 오류 발생", e);
        }
    }

    @Override
    public String toString() {
        return "Bidding{" +
               "id=" + id +
               ", title='" + title + '\'' +
               ", bidNumber='" + bidNumber + '\'' +
               '}';
    }
}