package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.orbit.entity.bidding.Bidding;

import com.orbit.entity.commonCode.SystemStatus;
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
    private List<String> attachmentPaths;
    
    // 시간 및 생성자 정보
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdBy;
    private Long updatedBy;
  
    
    // 공급자 및 참여 정보
    private List<BiddingSupplierDto> suppliers;
    private List<BiddingParticipationDto> participations;
    private int totalSuppliers;
    private int totalParticipations;

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
    
    // 입찰 방식 텍스트 가져오기
    public String getMethodText() {
        if (this.methodChild == null) {
            return "미정";
        }
        
        return switch (this.methodChild.getCodeValue()) {
            case "FIXED_PRICE" -> "정가제안";
            case "PRICE_SUGGESTION" -> "가격제안";
            default -> this.methodChild.getCodeValue();
        };
    }
    
    // Entity -> DTO 변환
    public static BiddingDto fromEntity(Bidding entity) {
        return BiddingDto.builder()
                .id(entity.getId())
                .bidNumber(entity.getBidNumber())
                .purchaseRequest(entity.getPurchaseRequest())
                .purchaseRequestId(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getId() : null)
                .purchaseRequestItem(entity.getPurchaseRequestItem())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
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
                .statusParent(entity.getStatusParent())
                .statusChild(entity.getStatusChild())
                .methodParent(entity.getMethodParent())
                .methodChild(entity.getMethodChild())
                .filePath(entity.getFilePath())
                .attachmentPaths(entity.getAttachmentPaths())
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                .createdAt(entity.getRegTime())
                .updatedAt(entity.getUpdateTime())
                .suppliers(new ArrayList<>())  // 빈 리스트로 초기화
                .participations(new ArrayList<>())  // 빈 리스트로 초기화
                .build();
    }
}