package com.orbit.repository.procurement;

import com.orbit.dto.procurement.dashboard.PurchaseRequestSummaryDTO;
import com.orbit.entity.procurement.PurchaseRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 구매 요청 커스텀 리포지토리 인터페이스
 */
public interface PurchaseRequestRepositoryCustom {
    // 상태별 구매요청 수
    Map<String, Long> countByStatus();

    // 상태별 예산 합계
    Map<String, BigDecimal> sumBudgetByStatus();

    // 부서별 구매요청 수
    Map<String, Long> countByDepartment();

    // 부서별 예산 합계
    Map<String, BigDecimal> sumBudgetByDepartment();

    // 필터링된 구매요청 목록
    List<PurchaseRequest> findWithFilters(String status, String department, LocalDate fromDate, LocalDate toDate, String projectId, String businessType);

    // 전체 예산 합계
    BigDecimal sumTotalBudget();

    // 상태 그룹별 예산 합계
    BigDecimal sumBudgetByStatusCategory(List<String> statusCodes);

    // 최근 구매요청 목록
    List<PurchaseRequestSummaryDTO> findRecentRequests(int limit);

    // 처리 대기중인 구매요청 목록
    List<PurchaseRequestSummaryDTO> findPendingRequests(int limit);
}