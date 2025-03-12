package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.state.SystemStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 입찰 공고 응답용 DTO
 */
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
    private Integer quantity;
    private String title;
    private String description;
    private String bidMethod;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String conditions;
    private String internalNote;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    private List<Long> supplierIds;
    private SystemStatus status;
    private String statusText;
    private String filePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String modifiedBy;
    
    // 상태 텍스트 가져오기 (UI 표시용)
    public String getStatusText() {
        if (this.status == null) {
            return "미정";
        }
        
        String childCode = this.status.getChildCode();
        if ("PENDING".equals(childCode)) return "대기중";
        if ("ONGOING".equals(childCode)) return "진행중";
        if ("CLOSED".equals(childCode)) return "마감";
        if ("CANCELED".equals(childCode)) return "취소";
        
        return childCode;
    }
    
    // Entity -> DTO 변환
    public static BiddingDto fromEntity(Bidding entity) {
        if (entity == null) {
            return null;
        }
        
        // BiddingPrice에서 금액 정보 가져오기
        BigDecimal unitPrice = null;
        BigDecimal supplyPrice = null;
        BigDecimal vat = null;
        BigDecimal totalAmount = null;
        
        if (entity.getBiddingPrice() != null) {
            unitPrice = entity.getBiddingPrice().getUnitPrice();
            supplyPrice = entity.getBiddingPrice().getSupplyPrice();
            vat = entity.getBiddingPrice().getVat();
            totalAmount = entity.getBiddingPrice().getTotalAmount();
        }
        
        BiddingDto dto = BiddingDto.builder()
                .id(entity.getId())
                .bidNumber(entity.getBidNumber())
                .purchaseRequestId(entity.getPurchaseRequestId())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
                .quantity(entity.getQuantity())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .bidMethod(entity.getBidMethod())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
                .unitPrice(unitPrice)
                .supplyPrice(supplyPrice)
                .vat(vat)
                .totalAmount(totalAmount)
                .status(entity.getStatus())
                .filePath(entity.getFilePath())
                // BaseEntity에서 상속받은 필드
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                // 시간 필드는 BaseTimeEntity에서 상속
                .createdAt(entity.getRegTime()) 
                .updatedAt(entity.getUpdateTime()) 
                .build();
        
        // 상태 텍스트 설정
        dto.setStatusText(dto.getStatusText());
        
        return dto;
    }
}