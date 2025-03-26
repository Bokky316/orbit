package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.orbit.entity.bidding.BiddingContract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingContractDto {
    private Long id;
    private String transactionNumber;
    private String title;
    private Long biddingId;
    private Long biddingParticipationId;
    private Long supplierId;
    private String supplierName;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deliveryDate;
    
    private BigDecimal totalAmount;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    
    private String status;
    
    private String description;
    private String contractFilePath;
    
    private String buyerSignature;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime buyerSignedAt;
    
    private String supplierSignature;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime supplierSignedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime regTime;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    
    private String createdBy;
    private String modifiedBy;
    
    public static BiddingContractDto fromEntity(BiddingContract entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingContractDto.builder()
                .id(entity.getId())
                .transactionNumber(entity.getTransactionNumber())
                .title(entity.getTitle())
                .biddingId(entity.getBidding() != null ? entity.getBidding().getId() : null)
                .biddingParticipationId(entity.getBiddingParticipation() != null ? entity.getBiddingParticipation().getId() : null)
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .deliveryDate(entity.getDeliveryDate())
                .totalAmount(entity.getTotalAmount())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .description(entity.getDescription())
                .contractFilePath(entity.getContractFilePath())
                .buyerSignature(entity.getBuyerSignature())
                .buyerSignedAt(entity.getBuyerSignedAt())
                .supplierSignature(entity.getSupplierSignature())
                .supplierSignedAt(entity.getSupplierSignedAt())
                .build();
    }
    
    public BiddingContract toEntity() {
        BiddingContract entity = new BiddingContract();
        entity.setId(this.id);
        entity.setTransactionNumber(this.transactionNumber);
        entity.setTitle(this.title);
        entity.setStartDate(this.startDate);
        entity.setEndDate(this.endDate);
        entity.setDeliveryDate(this.deliveryDate);
        entity.setTotalAmount(this.totalAmount);
        entity.setQuantity(this.quantity);
        entity.setUnitPrice(this.unitPrice);
        entity.setSupplyPrice(this.supplyPrice);
        entity.setVat(this.vat);
        entity.setDescription(this.description);
        entity.setContractFilePath(this.contractFilePath);
        return entity;
    }
}