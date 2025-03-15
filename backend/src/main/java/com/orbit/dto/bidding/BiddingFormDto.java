package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.commonCode.ChildCode;
import com.orbit.entity.commonCode.ParentCode;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.entity.procurement.PurchaseRequestItem;
import com.orbit.util.PriceCalculator;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 공고 등록/수정 폼 데이터 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Slf4j
public class BiddingFormDto {
    private Long id;
    
    // 구매 요청 관련 정보
    @NotNull(message = "구매 요청은 필수 선택 항목입니다.")
    private PurchaseRequest purchaseRequest;
    
    @NotNull(message = "구매 요청 품목은 필수 선택 항목입니다.")
    private PurchaseRequestItem purchaseRequestItem;
    
    // 입찰 기본 정보
    @NotBlank(message = "제목은 필수 입력값입니다.")
    @Size(max = 255, message = "제목은 최대 255자까지 입력 가능합니다.")
    private String title;
    
    private String description;
    
    @NotNull(message = "시작일은 필수 입력값입니다.")
    private LocalDateTime startDate;
    
    @NotNull(message = "마감일은 필수 입력값입니다.")
    private LocalDateTime endDate;
    
    @NotBlank(message = "입찰 조건은 필수 입력값입니다.")
    private String conditions;
    
    private String internalNote;
    
    // 수량 및 가격 정보
    @NotNull(message = "수량은 필수 입력값입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private Integer quantity;
    
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    // 상태 정보
    private ParentCode statusParent;
    private ChildCode statusChild;
    
    // 입찰 방식
    private ParentCode methodParent;
    private ChildCode methodChild;
    
    private List<Long> supplierIds;

    private List<String> attachmentPaths;
    
    /**
     * 수량 설정 (안전한 방식)
     */
    public void setQuantity(Integer quantity) {
        this.quantity = (quantity != null && quantity > 0) ? quantity : 1;
    }
    
    /**
     * 단가 설정 (안전한 방식)
     */
    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = (unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) >= 0) 
            ? unitPrice.setScale(0, RoundingMode.HALF_UP) 
            : BigDecimal.ZERO;
    }
    
    /**
     * 공급가 설정 (안전한 방식)
     */
    public void setSupplyPrice(BigDecimal supplyPrice) {
        this.supplyPrice = (supplyPrice != null && supplyPrice.compareTo(BigDecimal.ZERO) >= 0)
            ? supplyPrice.setScale(0, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
    }
    
    /**
     * 부가세 설정 (안전한 방식)
     */
    public void setVat(BigDecimal vat) {
        this.vat = (vat != null && vat.compareTo(BigDecimal.ZERO) >= 0)
            ? vat.setScale(0, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
    }
    
    /**
     * 총액 설정 (안전한 방식)
     */
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = (totalAmount != null && totalAmount.compareTo(BigDecimal.ZERO) >= 0)
            ? totalAmount.setScale(0, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
    }
    
    /**
     * 모든 금액 필드 재계산
     */
    public void recalculateAllPrices() {
        try {
            if (this.unitPrice != null && this.quantity != null) {
                PriceCalculator.PriceResult result = PriceCalculator.calculateAll(this.unitPrice, this.quantity);
                this.supplyPrice = result.getSupplyPrice();
                this.vat = result.getVat();
                this.totalAmount = result.getTotalAmount();
            } else if (this.supplyPrice != null) {
                this.vat = PriceCalculator.calculateVat(this.supplyPrice);
                this.totalAmount = PriceCalculator.calculateTotalAmount(this.supplyPrice, this.vat);
            }
            
            log.debug("금액 재계산 결과 - 단가: {}, 수량: {}, 공급가: {}, 부가세: {}, 총액: {}", 
                    this.unitPrice, this.quantity, this.supplyPrice, this.vat, this.totalAmount);
        } catch (Exception e) {
            log.error("금액 재계산 중 오류 발생", e);
            // 오류 발생 시 기본값 설정
            this.unitPrice = this.unitPrice == null ? BigDecimal.ZERO : this.unitPrice;
            this.supplyPrice = this.supplyPrice == null ? BigDecimal.ZERO : this.supplyPrice;
            this.vat = this.vat == null ? BigDecimal.ZERO : this.vat;
            this.totalAmount = this.totalAmount == null ? BigDecimal.ZERO : this.totalAmount;
        }
    }
    
    /**
     * DTO -> 엔티티 변환
     */
    public Bidding toEntity() {
        // 금액 재계산
        recalculateAllPrices();
        
        // 엔티티 생성
        Bidding bidding = Bidding.builder()
                .purchaseRequest(this.purchaseRequest)
                .purchaseRequestId(this.purchaseRequest.getId())
                .purchaseRequestItem(this.purchaseRequestItem)
                .purchaseRequestItemId(this.purchaseRequestItem.getId())
                .title(this.title)
                .description(this.description)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .conditions(this.conditions)
                .internalNote(this.internalNote)
                .quantity(this.quantity)
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .statusParent(this.statusParent)
                .statusChild(this.statusChild)
                .methodParent(this.methodParent)
                .methodChild(this.methodChild)
                .attachmentPaths(this.attachmentPaths)
                .build();
        
        // ID가 있는 경우 (수정 시) ID 설정
        if (this.id != null) {
            bidding.setId(this.id);
        }
        
        return bidding;
    }
    
    /**
     * 엔티티 -> DTO 변환
     */
    public static BiddingFormDto fromEntity(Bidding entity) {
        if (entity == null) {
            return null;
        }
        
        return BiddingFormDto.builder()
                .id(entity.getId())
                .purchaseRequest(entity.getPurchaseRequest())
                .purchaseRequestItem(entity.getPurchaseRequestItem())
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
                .attachmentPaths(entity.getAttachmentPaths())
                .build();
    }
}