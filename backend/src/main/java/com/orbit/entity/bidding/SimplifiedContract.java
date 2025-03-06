package com.orbit.entity.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
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
@Table(name = "simplified_contracts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimplifiedContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bidding_id", nullable = false)
    private Long biddingId; //입찰 ID

    @Column(name = "bidding_participation_id", nullable = false)
    private Long biddingParticipationId; //입찰 참여 ID

    @Column(name = "transaction_number", unique = true, nullable = false, length = 50)
    private String transactionNumber; //거래번호

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId; //공급자 ID

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate; //계약 시작일

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate; //계약 종료일

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount; //총금액

    @Column(name = "quantity", nullable = false)
    private Integer quantity; //수량

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice; //단가

    @Column(name = "delivery_date")
    private LocalDate deliveryDate; //납기일

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ContractStatus status; //계약상태

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_status", nullable = false)
    private SignatureStatus signatureStatus; //서명상태

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; //계약 설명

    @Column(name = "contract_file_path", length = 500)
    private String contractFilePath; //계약서 파일

    @Column(name = "signature_file_path", length = 500)
    private String signatureFilePath; //서명 문서 파일

    @Column(name = "final_contract_file_path", length = 500)
    private String finalContractFilePath; //최종계약서 파일

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt; //생성일시

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; //수정일시

    public enum ContractStatus {
        초안, 서명중, 활성, 완료, 취소
    }

    public enum SignatureStatus {
        미서명, 내부서명, 완료
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = ContractStatus.초안;
        this.signatureStatus = SignatureStatus.미서명;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}