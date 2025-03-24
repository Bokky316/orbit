package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    
    // 구매 요청 관련 정보
    private Long purchaseRequestId;
    private Long purchaseRequestItemId;
    private String purchaseRequestNumber;
    private String purchaseRequestName;
    
    // 입찰 기본 정보
    private String title;
    private String description;
    private String conditions;
    private String internalNote;

    // 입찰 기간 정보
    private BiddingPeriodDto biddingPeriod;
    
    // 수량 및 가격 정보
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    // 상태 정보
    private String status;     // 코드값
    private String statusName; // 표시명
    
    // 입찰 방식
    private String method;     // 코드값
    private String methodName; // 표시명
    
    // 파일 및 기타 정보
    private List<String> attachmentPaths;
    
    // 시간 및 생성자 정보
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime regTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    private String createdBy;
    private String modifiedBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime closedAt;
    private String closedBy;
    
    // 공급자 및 참여 정보
    private List<BiddingSupplierDto> suppliers;
    private List<BiddingParticipationDto> participations;
    private int totalSuppliers;
    private int totalParticipations;

    /**
     * 입찰 기간 정보를 담는 내부 DTO 클래스
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BiddingPeriodDto {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate startDate;
        
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate endDate;
    }

    /**
     * 엔티티에서 DTO로 변환
     */
    public static BiddingDto fromEntity(Bidding entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingDto.builder()
                .id(entity.getId())
                .bidNumber(entity.getBidNumber())
                .purchaseRequestId(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getId() : null)
                .purchaseRequestItemId(entity.getPurchaseRequestItem() != null ? entity.getPurchaseRequestItem().getId() : null)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
                .biddingPeriod(entity.getBiddingPeriod() != null ? 
                    new BiddingPeriodDto(entity.getBiddingPeriod().getStartDate(), entity.getBiddingPeriod().getEndDate()) : 
                    null)
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
                .status(entity.getStatusChild() != null ? entity.getStatusChild().getCodeValue() : null)
                .statusName(entity.getStatusChild() != null ? entity.getStatusChild().getCodeName() : null)
                .method(entity.getMethodChild() != null ? entity.getMethodChild().getCodeValue() : null)
                .methodName(entity.getMethodChild() != null ? entity.getMethodChild().getCodeName() : null)
                .attachmentPaths(entity.getAttachmentPaths())
                .regTime(entity.getRegTime())
                .updateTime(entity.getUpdateTime())
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                .closedAt(entity.getClosedAt()) 
                .closedBy(entity.getClosedBy()) 
                .build();
    }
}