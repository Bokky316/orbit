package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.Bidding.BiddingPrice;
import com.orbit.entity.commonCode.SystemStatus;
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
    
    @NotNull(message = "구매 요청 ID는 필수 입력값입니다.")
    private Long purchaseRequestId;
    
    @NotNull(message = "구매 요청 품목 ID는 필수 입력값입니다.")
    private Long purchaseRequestItemId;
    
    @NotBlank(message = "제목은 필수 입력값입니다.")
    @Size(max = 255, message = "제목은 최대 255자까지 입력 가능합니다.")
    private String title;
    
    private String description;
    
    @NotBlank(message = "입찰 방식은 필수 입력값입니다.")
    private String bidMethod;
    
    @NotNull(message = "시작일은 필수 입력값입니다.")
    private LocalDateTime startDate;
    
    @NotNull(message = "마감일은 필수 입력값입니다.")
    private LocalDateTime endDate;
    
    @NotBlank(message = "입찰 조건은 필수 입력값입니다.")
    private String conditions;
    
    private String internalNote;
    
    @NotNull(message = "수량은 필수 입력값입니다.")
    @Min(value = 1, message = "수량은 1 이상이어야 합니다.")
    private Integer quantity;
    
    private BigDecimal unitPrice;
    private BigDecimal supplyPrice;
    private BigDecimal vat;
    private BigDecimal totalAmount;
    
    private String status;
    
    private List<Long> supplierIds;
    
    private String filePath;
    
    /**
     * 수량
     * @param quantity
     */
    public void setQuantity(Integer quantity) {
        // 음수나 null 방지
        this.quantity = (quantity != null && quantity > 0) ? quantity : 1;
    }
    
    /**
     * 단가 
     * @param unitPrice 
     */
    public void setUnitPrice(BigDecimal unitPrice) {
        // 음수나 null 방지, 소수점 2자리까지 반올림
        if (unitPrice == null) {
            this.unitPrice = BigDecimal.ZERO;
        } else {
            // 음수면 0으로 설정
            this.unitPrice = unitPrice.compareTo(BigDecimal.ZERO) < 0 
                ? BigDecimal.ZERO 
                : unitPrice.setScale(0, RoundingMode.HALF_UP); // 소수점 제거하고 반올림
        }
    }
    
    /**
     * 단가 문자열
     * @param unitPrice
     */
    public void setUnitPrice(String unitPrice) {
        try {
            // 숫자로 변환 가능한 문자열인 경우
            BigDecimal value = new BigDecimal(unitPrice);
            setUnitPrice(value);
        } catch (NumberFormatException e) {
            // 변환 불가능한 문자열이면 0으로 설정
            this.unitPrice = BigDecimal.ZERO;
        }
    }
    
    /**
     * 공급가
     * @param supplyPrice 
     */
    public void setSupplyPrice(BigDecimal supplyPrice) {
        if (supplyPrice == null) {
            this.supplyPrice = BigDecimal.ZERO;
        } else {
            this.supplyPrice = supplyPrice.compareTo(BigDecimal.ZERO) < 0 
                ? BigDecimal.ZERO 
                : supplyPrice.setScale(0, RoundingMode.HALF_UP);
        }
    }
    
    /**
     * 부가세 
     * @param vat 
     */
    public void setVat(BigDecimal vat) {
        if (vat == null) {
            this.vat = BigDecimal.ZERO;
        } else {
            this.vat = vat.compareTo(BigDecimal.ZERO) < 0 
                ? BigDecimal.ZERO 
                : vat.setScale(0, RoundingMode.HALF_UP);
        }
    }
    
    /**
     * 총액 
     * @param totalAmount 
     */
    public void setTotalAmount(BigDecimal totalAmount) {
        if (totalAmount == null) {
            this.totalAmount = BigDecimal.ZERO;
        } else {
            this.totalAmount = totalAmount.compareTo(BigDecimal.ZERO) < 0 
                ? BigDecimal.ZERO 
                : totalAmount.setScale(0, RoundingMode.HALF_UP);
        }
    }
    
    /**
     * 모든 금액 필드를 한 번에 안전하게 재계산
     */
    public void recalculateAllPrices() {
        try {
            // 단가와 수량이 있으면 모든 금액 필드 재계산
            if (this.unitPrice != null && this.quantity != null) {
                PriceCalculator.PriceResult result = PriceCalculator.calculateAll(this.unitPrice, this.quantity);
                this.supplyPrice = result.getSupplyPrice();
                this.vat = result.getVat();
                this.totalAmount = result.getTotalAmount();
            } else if (this.supplyPrice != null) {
                // 단가나 수량이 없지만 공급가가 있으면 부가세와 총액 계산
                this.vat = PriceCalculator.calculateVat(this.supplyPrice);
                this.totalAmount = PriceCalculator.calculateTotalAmount(this.supplyPrice, this.vat);
            }
            
            log.debug("금액 재계산 결과 - 단가: {}, 수량: {}, 공급가: {}, 부가세: {}, 총액: {}", 
                    this.unitPrice, this.quantity, this.supplyPrice, this.vat, this.totalAmount);
        } catch (Exception e) {
            log.error("금액 재계산 중 오류 발생", e);
            // 오류 발생 시 기본값 설정
            if (this.unitPrice == null) this.unitPrice = BigDecimal.ZERO;
            if (this.supplyPrice == null) this.supplyPrice = BigDecimal.ZERO;
            if (this.vat == null) this.vat = BigDecimal.ZERO;
            if (this.totalAmount == null) this.totalAmount = BigDecimal.ZERO;
        }
    }
    
    // 상태 객체로 변환하는 편의 메서드
    public SystemStatus getStatusObject() {
        return new SystemStatus("BIDDING", status != null ? status : "PENDING");
    }
    
    // BiddingFormDto -> Bidding 엔티티 변환
    public Bidding toEntity() {
        // 모든 금액 필드 안전하게 재계산
        recalculateAllPrices();
        
        // 가격 객체 생성
        BiddingPrice price = BiddingPrice.builder()
                .unitPrice(this.unitPrice)
                .supplyPrice(this.supplyPrice)
                .vat(this.vat)
                .totalAmount(this.totalAmount)
                .build();
        
        // 엔티티 생성
        Bidding bidding = Bidding.builder()
                .purchaseRequestId(this.purchaseRequestId)
                .purchaseRequestItemId(this.purchaseRequestItemId)
                .title(this.title)
                .description(this.description)
                .bidMethod(this.bidMethod)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .conditions(this.conditions)
                .internalNote(this.internalNote)
                .quantity(this.quantity)
                .biddingPrice(price)
                .filePath(this.filePath)
                .build();
        
        // 상태 설정
        bidding.setStatus(this.getStatusObject());
        
        // ID가 있는 경우 (수정 시) ID 설정
        if (this.id != null) {
            bidding.setId(this.id);
        }
        
        return bidding;
    }
    
    // Bidding 엔티티 -> BiddingFormDto 변환 (기존 코드 유지)
    public static BiddingFormDto fromEntity(Bidding entity) {
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
        
        return BiddingFormDto.builder()
                .id(entity.getId())
                .purchaseRequestId(entity.getPurchaseRequestId())
                .purchaseRequestItemId(entity.getPurchaseRequestItemId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .bidMethod(entity.getBidMethod())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .conditions(entity.getConditions())
                .internalNote(entity.getInternalNote())
                .quantity(entity.getQuantity())
                .unitPrice(unitPrice)
                .supplyPrice(supplyPrice)
                .vat(vat)
                .totalAmount(totalAmount)
                .status(entity.getStatus() != null ? entity.getStatus().getChildCode() : null)
                .filePath(entity.getFilePath())
                .build();
    }
}