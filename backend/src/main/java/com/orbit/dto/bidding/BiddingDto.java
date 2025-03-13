package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;

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
    
    // 구매 요청 관련 정보
    private PurchaseRequest purchaseRequest;
    private Long purchaseRequestId;
    private PurchaseRequestItem purchaseRequestItem;
    private Long purchaseRequestItemId;
    
    // 입찰 기본 정보
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String conditions;
    private String internalNote;
    
    // 수량 및 가격 정보
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    // 상태 정보
    private ParentCode statusParent;
    private ChildCode statusChild;
    private String statusText;
    
    // 입찰 방식
    private ParentCode methodParent;
    private ChildCode methodChild;
    
    // 파일 및 기타 정보
    private String filePath;
    
    // 시간 및 생성자 정보
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String modifiedBy;
    
    // 공급자 및 참여 정보
    private List<Long> supplierIds;

    // 상태 텍스트 가져오기 (UI 표시용)
    public String getStatusText() {
        if (this.statusChild == null) {
            return "미정";
        }
        
        return switch (this.statusChild.getCodeValue()) {
            case "PENDING" -> "대기중";
            case "ONGOING" -> "진행중";
            case "CLOSED" -> "마감";
            case "CANCELED" -> "취소";
            default -> this.statusChild.getCodeValue();
        };
    }
    
    // Entity -> DTO 변환
    public static BiddingDto fromEntity(Bidding entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingDto.builder()
                .id(entity.getId())
                .bidNumber(entity.getBidNumber())
                .purchaseRequest(entity.getPurchaseRequest())
                .purchaseRequestId(entity.getPurchaseRequestId())
                .purchaseRequestItem(entity.getPurchaseRequestItem())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .statusParent(entity.getStatusParent())
                .statusChild(entity.getStatusChild())
                .methodParent(entity.getMethodParent())
                .methodChild(entity.getMethodChild())
                .filePath(entity.getFilePath())
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                .createdAt(entity.getRegTime())
                .updatedAt(entity.getUpdateTime())
                .build();
    }
}