package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.SimplifiedContract;
import com.orbit.entity.bidding.SimplifiedContract.ContractStatus;
import com.orbit.entity.bidding.SimplifiedContract.SignatureStatus; 

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimplifiedContractDto {
    private Long id;
    private Long biddingId;
    private Long biddingParticipationId;
    private String transactionNumber;
    private Long supplierId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal totalAmount;
    private Integer quantity;
    private BigDecimal unitPrice;
    private LocalDate deliveryDate;
    private ContractStatus status;
    private SignatureStatus signatureStatus;
    private String description;
    private String contractFilePath;
    private String signatureFilePath;
    private String finalContractFilePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity -> DTO 변환
    public static SimplifiedContractDto fromEntity(SimplifiedContract entity) {
        return SimplifiedContractDto.builder()
                .id(entity.getId())
                .biddingId(entity.getBiddingId()) 
                .biddingParticipationId(entity.getBiddingParticipationId()) 
                .transactionNumber(entity.getTransactionNumber())
                .supplierId(entity.getSupplierId())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .totalAmount(entity.getTotalAmount())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .deliveryDate(entity.getDeliveryDate())
                .status(entity.getStatus())
                .signatureStatus(entity.getSignatureStatus())
                .description(entity.getDescription())
                .contractFilePath(entity.getContractFilePath())
                .signatureFilePath(entity.getSignatureFilePath())
                .finalContractFilePath(entity.getFinalContractFilePath())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
    
    // DTO -> Entity 변환 
    public SimplifiedContract toEntity() {
        return SimplifiedContract.builder()
                .id(this.id)
                .biddingId(this.biddingId) 
                .biddingParticipationId(this.biddingParticipationId)
                .transactionNumber(this.transactionNumber)
                .supplierId(this.supplierId)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .totalAmount(this.totalAmount)
                .quantity(this.quantity)
                .unitPrice(this.unitPrice)
                .deliveryDate(this.deliveryDate)
                .status(this.status)
                .signatureStatus(this.signatureStatus)
                .description(this.description)
                .contractFilePath(this.contractFilePath)
                .signatureFilePath(this.signatureFilePath)
                .finalContractFilePath(this.finalContractFilePath)
                .build();
    }
}