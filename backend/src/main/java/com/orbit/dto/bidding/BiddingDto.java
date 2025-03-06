package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.orbit.entity.bidding.Bidding;

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
public class BiddingDto {
    private Long id;
    private String bidNumber;
    private Long purchaseRequestId;
    private Long purchaseRequestItemId;
    private Integer quantity;  // BiddingService의 calculateBiddingPrices 메서드 관련
    private String title;
    private String description;
    private Bidding.BidMethod bidMethod;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String conditions;
    private String internalNote;
    private BigDecimal biddingUnitPrice;
    private BigDecimal biddingSupplyPrice;
    private BigDecimal biddingVat;
    private Bidding.BiddingStatus status;
    private String filePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
  
    
    // Entity -> DTO 변환
    public static BiddingDto fromEntity(Bidding entity) {
        return BiddingDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .bidMethod(entity.getBidMethod())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
                .biddingUnitPrice(entity.getBiddingUnitPrice())
                .biddingSupplyPrice(entity.getBiddingSupplyPrice())
                .biddingVat(entity.getBiddingVat())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    // DTO -> Entity 변환
    public Bidding toEntity() {
        return Bidding.builder()
                .id(this.id)
                .bidNumber(this.bidNumber)
                .title(this.title)
                .description(this.description)
                .bidMethod(this.bidMethod)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .conditions(this.conditions)
                .internalNote(this.internalNote)
                .biddingUnitPrice(this.biddingUnitPrice)
                .biddingSupplyPrice(this.biddingSupplyPrice)
                .biddingVat(this.biddingVat)
                .status(this.status)
                .filePath(this.filePath)
                .build();
    }
}