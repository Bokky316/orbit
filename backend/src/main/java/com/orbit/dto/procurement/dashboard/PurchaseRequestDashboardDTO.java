package com.orbit.dto.procurement.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestDashboardDTO {
    private Long totalCount;                         // 전체 구매요청 수
    private Map<String, Long> countByStatus;         // 상태별 구매요청 수
    private Map<String, BigDecimal> budgetByStatus;  // 상태별 총 예산
    private Map<String, Long> countByDepartment;     // 부서별 구매요청 수
    private Map<String, BigDecimal> budgetByDepartment; // 부서별 총 예산
    private List<PurchaseRequestSummaryDTO> recentRequests; // 최근 구매요청 목록
    private List<PurchaseRequestSummaryDTO> pendingRequests; // 처리 대기중인 요청 목록
    private BigDecimal totalBudget;                  // 총 예산
    private BigDecimal completedBudget;              // 완료된 요청의 총 예산
    private BigDecimal pendingBudget;                // 진행중인 요청의 총 예산
}