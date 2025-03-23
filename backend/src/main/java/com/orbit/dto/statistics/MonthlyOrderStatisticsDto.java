package com.orbit.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyOrderStatisticsDto {
    private String yearMonth;      // 년-월 (예: "2025-01")
    private Long orderCount;       // 주문 수
    private Double totalAmount;    // 총 금액
} 