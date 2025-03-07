package com.orbit.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 금액 계산 관련 유틸리티 클래스
 * 구매 요청, 입찰, 계약, 지불 등에서 공통으로 사용
 */
public class PriceCalculator {

    // 기본 상수
    public static final BigDecimal VAT_RATE = new BigDecimal("0.1"); // 10% 부가세율
    public static final int DECIMAL_SCALE = 2; // 소수점 자리수
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP; // 반올림 방식

    /**
     * 단가와 수량으로 공급가액 계산
     *
     * @param unitPrice 단가
     * @param quantity 수량
     * @return 공급가액 (단가 * 수량)
     */
    public static BigDecimal calculateSupplyPrice(BigDecimal unitPrice, Integer quantity) {
        if (unitPrice == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        
        return unitPrice.multiply(BigDecimal.valueOf(quantity))
                .setScale(DECIMAL_SCALE, ROUNDING_MODE);
    }

    /**
     * 공급가액으로 부가세 계산
     *
     * @param supplyPrice 공급가액
     * @return 부가세 (공급가액 * 10%)
     */
    public static BigDecimal calculateVat(BigDecimal supplyPrice) {
        if (supplyPrice == null) {
            return BigDecimal.ZERO;
        }
        
        return supplyPrice.multiply(VAT_RATE)
                .setScale(DECIMAL_SCALE, ROUNDING_MODE);
    }

    /**
     * 공급가액과 부가세로 총액 계산
     *
     * @param supplyPrice 공급가액
     * @param vat 부가세
     * @return 총액 (공급가액 + 부가세)
     */
    public static BigDecimal calculateTotalAmount(BigDecimal supplyPrice, BigDecimal vat) {
        BigDecimal supply = supplyPrice != null ? supplyPrice : BigDecimal.ZERO;
        BigDecimal tax = vat != null ? vat : BigDecimal.ZERO;
        
        return supply.add(tax).setScale(DECIMAL_SCALE, ROUNDING_MODE);
    }

    /**
     * 단가와 수량으로 공급가액, 부가세, 총액을 한번에 계산
     *
     * @param unitPrice 단가
     * @param quantity 수량
     * @return PriceResult 객체 (공급가액, 부가세, 총액 포함)
     */
    public static PriceResult calculateAll(BigDecimal unitPrice, Integer quantity) {
        BigDecimal supplyPrice = calculateSupplyPrice(unitPrice, quantity);
        BigDecimal vat = calculateVat(supplyPrice);
        BigDecimal totalAmount = calculateTotalAmount(supplyPrice, vat);
        
        return new PriceResult(supplyPrice, vat, totalAmount);
    }

    /**
     * 계산 결과를 담는 내부 클래스
     */
    public static class PriceResult {
        private final BigDecimal supplyPrice;
        private final BigDecimal vat;
        private final BigDecimal totalAmount;

        public PriceResult(BigDecimal supplyPrice, BigDecimal vat, BigDecimal totalAmount) {
            this.supplyPrice = supplyPrice;
            this.vat = vat;
            this.totalAmount = totalAmount;
        }

        public BigDecimal getSupplyPrice() {
            return supplyPrice;
        }

        public BigDecimal getVat() {
            return vat;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }
        
        @Override
        public String toString() {
            return "PriceResult{" +
                    "supplyPrice=" + supplyPrice +
                    ", vat=" + vat +
                    ", totalAmount=" + totalAmount +
                    '}';
        }
    }
}