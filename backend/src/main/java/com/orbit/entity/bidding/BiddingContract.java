package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.BaseEntity;
import com.orbit.entity.member.Member;
import com.orbit.entity.state.StatusHistory;
import com.orbit.entity.state.SystemStatus;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
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
import jakarta.persistence.Transient;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidding_id", nullable = false)
    private Bidding bidding;

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

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "parentCode", column = @Column(name = "status_parent")),
        @AttributeOverride(name = "childCode", column = @Column(name = "status_child"))
    })
    private SystemStatus status;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "contract_file_path")
    private String contractFilePath;

    @Column(name = "buyer_signature", columnDefinition = "TEXT")
    private String buyerSignature;

    @Column(name = "supplier_signature", columnDefinition = "TEXT")
    private String supplierSignature;

    @OneToMany(mappedBy = "biddingContract", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StatusHistory> statusHistories = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private Member updatedBy;

    /**
     * 계약 상태가 자동으로 업데이트되어야 하는지 확인
     * 두 서명이 모두 있으면 진행중 상태로 변경
     */
    public void checkSignatureStatus() {
        if (buyerSignature != null && supplierSignature != null &&
            "BIDDING_CONTRACT".equals(status.getParentCode()) && 
            "DRAFT".equals(status.getChildCode())) {
            status.setParentCode("BIDDING_CONTRACT");
            status.setChildCode("IN_PROGRESS");
        }
    }

    /**
     * 상태 확인 메서드 수정 (StatusCode와 일치하도록 변경)
     */
    public boolean isDraft() {
        return "BIDDING_CONTRACT".equals(status.getParentCode()) &&
               "DRAFT".equals(status.getChildCode());
    }

    public boolean isInProgress() {
        return "BIDDING_CONTRACT".equals(status.getParentCode()) &&
               "IN_PROGRESS".equals(status.getChildCode());
    }

    public boolean isCompleted() {
        return "BIDDING_CONTRACT".equals(status.getParentCode()) &&
               "CLOSED".equals(status.getChildCode());
    }

    public boolean isCancelled() {
        return "BIDDING_CONTRACT".equals(status.getParentCode()) &&
               "CANCELED".equals(status.getChildCode());
    }

    /**
     * 상태값 열거형
     */
    public enum ContractStatus {
        초안,
        진행중,
        완료,
        취소
    }

    /**
     * 상태 열거형 반환 (StatusCode와 일치하도록 변경)
     */
    @Transient
    public ContractStatus getStatusEnum() {
        if (status == null) {
            return null;
        }

        switch (status.getChildCode()) {
            case "DRAFT": return ContractStatus.초안;
            case "IN_PROGRESS": return ContractStatus.진행중;
            case "CLOSED": return ContractStatus.완료;
            case "CANCELED": return ContractStatus.취소;
            default: return null;
        }
    }

    /**
     * 상태 열거형 설정
     */
    public void setStatusEnum(ContractStatus contractStatus) {
        if (contractStatus == null) return;

        switch (contractStatus) {
            case 초안 -> this.status = new SystemStatus("BIDDING_CONTRACT", "DRAFT");
            case 진행중 -> this.status = new SystemStatus("BIDDING_CONTRACT", "IN_PROGRESS");
            case 완료 -> this.status = new SystemStatus("BIDDING_CONTRACT", "CLOSED");
            case 취소 -> this.status = new SystemStatus("BIDDING_CONTRACT", "CANCELED");
        }
    }
}
