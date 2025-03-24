package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
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

    // 구매 요청 관련 정보
    private Long purchaseRequestId;
    private Long purchaseRequestItemId;
    private String purchaseRequestNumber;
    private String purchaseRequestName;
    private String purchaseRequestItemName;
    private String deliveryLocation;
    private LocalDate deliveryRequestDate;
    private String customer;
    private LocalDate requestDate;
    private String businessDepartment;
    private String prStatusChild;

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

    public static BiddingDto fromEntity(Bidding entity) {
        if (entity == null) {
            return null;
        }
    
        List<BiddingSupplierDto> supplierDtos = entity.getSuppliers() != null
                ? entity.getSuppliers().stream()
                    .map(BiddingSupplierDto::fromEntity)
                    .toList()
                : List.of();
    
        List<BiddingParticipationDto> participationDtos = entity.getParticipations() != null
                ? entity.getParticipations().stream()
                    .map(BiddingParticipationDto::fromEntity)
                    .toList()
                : List.of();
    
        return BiddingDto.builder()
                .id(entity.getId())
                .bidNumber(entity.getBidNumber())
    
                // 구매요청 관련 정보
                .purchaseRequestId(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getId() : null)
                .purchaseRequestItemId(entity.getPurchaseRequestItem() != null ? entity.getPurchaseRequestItem().getId() : null)
                .purchaseRequestNumber(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getRequestNumber() : null)
                .purchaseRequestName(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getRequestName() : null)
                .purchaseRequestItemName(entity.getPurchaseRequestItem() != null && entity.getPurchaseRequestItem().getItem() != null ? entity.getPurchaseRequestItem().getItem().getName() : null)
                .deliveryLocation(entity.getPurchaseRequestItem() != null ? entity.getPurchaseRequestItem().getDeliveryLocation() : null)
                .deliveryRequestDate(entity.getPurchaseRequestItem() != null ? entity.getPurchaseRequestItem().getDeliveryRequestDate() : null)
                .customer(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getCustomer() : null)
                .requestDate(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getRequestDate() : null)
                .businessDepartment(entity.getPurchaseRequest() != null ? entity.getPurchaseRequest().getBusinessDepartment() : null)
                .prStatusChild(entity.getPurchaseRequest() != null && entity.getPurchaseRequest().getStatus() != null
                    ? entity.getPurchaseRequest().getStatus().getChildCode() : null)
    
                // 기본 정보
                .title(entity.getTitle())
                .description(entity.getDescription())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
    
                // 입찰 기간
                .biddingPeriod(entity.getBiddingPeriod() != null
                        ? new BiddingPeriodDto(entity.getBiddingPeriod().getStartDate(), entity.getBiddingPeriod().getEndDate())
                        : null)
    
                // 가격 정보
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .supplyPrice(entity.getSupplyPrice())
                .vat(entity.getVat())
                .totalAmount(entity.getTotalAmount())
    
                // 상태 및 방식
                .status(entity.getStatusChild() != null ? entity.getStatusChild().getCodeValue() : null)
                .statusName(entity.getStatusChild() != null ? entity.getStatusChild().getCodeName() : null)
                .method(entity.getMethodChild() != null ? entity.getMethodChild().getCodeValue() : null)
                .methodName(entity.getMethodChild() != null ? entity.getMethodChild().getCodeName() : null)
    
                // 첨부파일
                .attachmentPaths(entity.getAttachmentPaths())
    
                // 시간 정보
                .regTime(entity.getRegTime())
                .updateTime(entity.getUpdateTime())
                .createdBy(entity.getCreatedBy())
                .modifiedBy(entity.getModifiedBy())
                .closedAt(entity.getClosedAt())
                .closedBy(entity.getClosedBy())
    
                // 공급사, 참여 정보
                .suppliers(supplierDtos)
                .participations(participationDtos)
                .totalSuppliers(supplierDtos.size())
                .totalParticipations(participationDtos.size())
    
                .build();
        
        // 상태 텍스트 설정
        dto.setStatusText(dto.getStatusText());
        
        return dto;
    }
    

    
}
