package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingContract;

import com.orbit.entity.commonCode.SystemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 입찰 계약 응답용 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiddingContractDto {

    private Long id;
    private String transactionNumber;
    private Long biddingId;
    private Long biddingParticipationId;
    private Long supplierId;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate deliveryDate;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private SystemStatus status;
    private String statusText;
    private String description;
    private String contractFilePath;
    private String buyerSignature;
    private String supplierSignature;
    private String createdBy;
    private String updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /**
     * 상태 텍스트 변환 (UI 표시용)
     */
    public String getStatusText() {
        if (this.status == null) {
            return "미정";
        }
        return switch (this.status.getChildCode()) {
            case "DRAFT" -> "초안";
            case "IN_PROGRESS" -> "진행중";
            case "CLOSED" -> "완료";
            case "CANCELED" -> "취소";
            default -> this.status.getChildCode();
        };
    }

    /**
     * Entity -> DTO 변환
     */
    public static BiddingContractDto fromEntity(BiddingContract contract) {
        if (contract == null) {
            return null;
        }

        BiddingContractDto dto = BiddingContractDto.builder()
                .id(contract.getId())
                .transactionNumber(contract.getTransactionNumber())
                .biddingId(contract.getBidding().getId())
                .biddingParticipationId(contract.getBiddingParticipation().getId())
                .supplierId(contract.getSupplier().getId())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .deliveryDate(contract.getDeliveryDate())
                .quantity(contract.getQuantity())
                .unitPrice(contract.getUnitPrice())
                .totalAmount(contract.getTotalAmount())
                .status(contract.getStatus())
                .description(contract.getDescription())
                .contractFilePath(contract.getContractFilePath())
                .buyerSignature(contract.getBuyerSignature())
                .supplierSignature(contract.getSupplierSignature())
                .createdBy(contract.getCreatedBy()) 
                .updatedBy(contract.getUpdatedBy() != null ? contract.getUpdatedBy().getId().toString() : null)
                .createdAt(contract.getRegTime()) 
                .updatedAt(contract.getUpdateTime()) 
                .build();

        // 상태 텍스트 설정
        dto.setStatusText(dto.getStatusText());

        return dto;
    }
}
