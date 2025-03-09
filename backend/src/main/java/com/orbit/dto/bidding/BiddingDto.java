package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    private List<Long> supplierIds;  // 다중 공급자 정보를 저장할 필드 추가
    private Bidding.BiddingStatus status;
    private String filePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
  
    
    // 필드명 불일치 해결을 위한 변환 메서드 추가
    public void setBiddingConditions(String biddingConditions) {
        this.conditions = biddingConditions;
    }

    public String getBiddingConditions() {
        return this.conditions;
    }

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
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
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
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .status(this.status)
                .filePath(this.filePath)
                .build();
    }
}