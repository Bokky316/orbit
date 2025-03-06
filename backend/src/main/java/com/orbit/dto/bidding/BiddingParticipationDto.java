package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.BiddingParticipation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingParticipationDto {
    private Long id;
    private Long biddingId;
    private Long biddingItemId;
    private Long supplierId;
    private BigDecimal proposedPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private LocalDate deliveryDate;
    private String description;
    private String proposalFilePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Entity -> DTO 변환
public static BiddingParticipationDto fromEntity(BiddingParticipation entity) {
    return BiddingParticipationDto.builder()
            .id(entity.getId())
            .biddingId(entity.getBiddingId()) 
            .biddingItemId(entity.getBiddingItemId()) 
            .supplierId(entity.getSupplierId())
            .proposedPrice(entity.getProposedPrice())
            .supplyPrice(entity.getSupplyPrice())
            .vat(entity.getVat())
            .deliveryDate(entity.getDeliveryDate())
            .description(entity.getDescription())
            .proposalFilePath(entity.getProposalFilePath())
            .createdAt(entity.getCreatedAt())
            .updatedAt(entity.getUpdatedAt())
            .build();
}
    
    // DTO -> Entity 변환 (부분적으로, bidding 객체는 서비스에서 설정)
    public BiddingParticipation toEntity() {
        return BiddingParticipation.builder()
                .id(this.id)
                .biddingId(this.biddingId) 
                .biddingItemId(this.biddingItemId) 
                .supplierId(this.supplierId)
                .proposedPrice(this.proposedPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .deliveryDate(this.deliveryDate)
                .description(this.description)
                .proposalFilePath(this.proposalFilePath)
                .build();
    }
}