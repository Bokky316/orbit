package com.orbit.dto.bidding;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.orbit.util.PriceCalculator;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Slf4j
public class BiddingFormDto {
    private Long id;
    
    // 구매 요청 관련 정보
    private Long purchaseRequestId; 
    
    @NotNull(message = "구매 요청 품목은 필수 선택 항목입니다.")
    private Long purchaseRequestItemId; 
 
    private String requestNumber;
 
    private String requestName; 
 
    private String deliveryLocation;
    
    // 구매 요청 상태
    private String prStatusChild;
    
    // 구매 요청 고객
    private String customer;
    
    // 구매 요청 날짜
    private LocalDate requestDate;
    
    // 사업부
    private String businessDepartment;
    
    // 입찰 기간 정보
    @NotNull(message = "입찰 기간은 필수입니다")
    @Valid
    private BiddingPeriod biddingPeriod;
    
    // 납품 요청일
    private LocalDate deliveryRequestDate;
    
    // 입찰 기본 정보
    @NotBlank(message = "제목은 필수 입력값입니다.")
    @Size(max = 255, message = "제목은 최대 255자까지 입력 가능합니다.")
    private String title;
    
    private String description;
    
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
    private String status; 
    
    // 입찰 방식
    private String method;

    private List<Long> supplierIds;

    private List<String> attachmentPaths;
    
    // 상태 코드 메서드
    public String getStatusChild() {
        return this.status;
    }

    // 입찰 방식 메서드 추가
    public String getMethod() {
        return this.method;
    }
    
    /**
     * 입찰 기간 정보
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BiddingPeriod {
        @NotNull(message = "시작일은 필수입니다")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate startDate;
        
        @NotNull(message = "종료일은 필수입니다")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate endDate;
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
}