package com.orbit.service.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestDashboardDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestProgressDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestSummaryDTO;
import com.orbit.entity.procurement.PurchaseRequest;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PurchaseRequestDashboardService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestService purchaseRequestService;

    // 구매요청 프로세스 단계 목록
    private final List<String> processSteps = Arrays.asList(
            "REQUESTED", "RECEIVED", "VENDOR_SELECTION",
            "CONTRACT_PENDING", "INSPECTION", "INVOICE_ISSUED", "PAYMENT_COMPLETED"
    );

    // 완료된 상태 코드 목록
    private final List<String> completedStatusCodes = List.of("PAYMENT_COMPLETED");

    // 진행중인 상태 코드 목록
    private final List<String> inProgressStatusCodes = Arrays.asList(
            "REQUESTED", "RECEIVED", "VENDOR_SELECTION",
            "CONTRACT_PENDING", "INSPECTION", "INVOICE_ISSUED"
    );

    /**
     * 대시보드 데이터 조회
     */
    public PurchaseRequestDashboardDTO getDashboardData() {
        // 1. 전체 건수 조회
        long totalCount = purchaseRequestRepository.count();

        // 2. 상태별 건수 및 예산 조회
        Map<String, Long> countByStatus = purchaseRequestRepository.countByStatus();
        Map<String, BigDecimal> budgetByStatus = purchaseRequestRepository.sumBudgetByStatus();

        // 3. 부서별 건수 및 예산 조회
        Map<String, Long> countByDepartment = purchaseRequestRepository.countByDepartment();
        Map<String, BigDecimal> budgetByDepartment = purchaseRequestRepository.sumBudgetByDepartment();

        // 4. 최근 구매요청 목록 (10건)
        List<PurchaseRequestSummaryDTO> recentRequests = purchaseRequestRepository.findRecentRequests(10);

        // 5. 처리 대기중인 요청 목록 (10건)
        List<PurchaseRequestSummaryDTO> pendingRequests = purchaseRequestRepository.findPendingRequests(10);

        // 6. 예산 합계 계산
        BigDecimal totalBudget = purchaseRequestRepository.sumTotalBudget();
        BigDecimal completedBudget = purchaseRequestRepository.sumBudgetByStatusCategory(completedStatusCodes);
        BigDecimal pendingBudget = purchaseRequestRepository.sumBudgetByStatusCategory(inProgressStatusCodes);

        // 7. DTO 생성 및 반환
        return PurchaseRequestDashboardDTO.builder()
                .totalCount(totalCount)
                .countByStatus(countByStatus)
                .budgetByStatus(budgetByStatus)
                .countByDepartment(countByDepartment)
                .budgetByDepartment(budgetByDepartment)
                .recentRequests(recentRequests)
                .pendingRequests(pendingRequests)
                .totalBudget(totalBudget)
                .completedBudget(completedBudget)
                .pendingBudget(pendingBudget)
                .build();
    }

    /**
     * 필터링된 구매요청 목록 조회
     */
    public List<PurchaseRequestDTO> getFilteredRequests(
            String status, String department, LocalDate fromDate, LocalDate toDate, String projectId, String businessType) {

        List<PurchaseRequest> filteredRequests = purchaseRequestRepository.findWithFilters(
                status, department, fromDate, toDate, projectId, businessType);

        return filteredRequests.stream()
                .map(purchaseRequestService::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 프로젝트별 구매요청 목록 조회
     */
    public List<PurchaseRequestDTO> getRequestsByProject(Long projectId) {
        List<PurchaseRequest> projectRequests = purchaseRequestRepository.findByProjectId(projectId);

        return projectRequests.stream()
                .map(purchaseRequestService::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 구매요청 진행 상태 조회
     */
    public PurchaseRequestProgressDTO getRequestProgress(Long requestId) {
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("ID " + requestId + "에 해당하는 구매 요청이 없습니다."));

        String currentStatus = request.getStatus() != null ? request.getStatus().getChildCode() : null;

        // 현재 상태가 없으면 기본값 설정
        if (currentStatus == null) {
            currentStatus = "REQUESTED";
        }

        // 현재 상태의 인덱스 찾기
        int currentStepIndex = processSteps.indexOf(currentStatus);
        if (currentStepIndex == -1) {
            currentStepIndex = 0; // 상태를 찾을 수 없는 경우 첫 단계로 설정
        }

        // 완료된 단계 목록
        List<String> completedSteps = processSteps.subList(0, currentStepIndex + 1);

        // 남은 단계 목록
        List<String> pendingSteps = currentStepIndex < processSteps.size() - 1
                ? processSteps.subList(currentStepIndex + 1, processSteps.size())
                : Collections.emptyList();

        // 다음 단계
        String nextStep = pendingSteps.isEmpty() ? null : pendingSteps.get(0);

        // 완료율 계산
        double completionPercentage = (double) (currentStepIndex + 1) / processSteps.size() * 100;

        return PurchaseRequestProgressDTO.builder()
                .requestNumber(request.getRequestNumber())
                .requestName(request.getRequestName())
                .currentStatus(currentStatus)
                .completedSteps(completedSteps)
                .pendingSteps(pendingSteps)
                .nextStep(nextStep)
                .completionPercentage(completionPercentage)
                .build();
    }

    /**
     * 전체 부서 목록 조회
     */
    public List<String> getAllDepartments() {
        return purchaseRequestRepository.findAllBusinessDepartments();
    }

    /**
     * 전체 상태 목록 조회
     */
    public List<String> getAllStatusCodes() {
        return purchaseRequestRepository.findAllStatusCodes();
    }

    /**
     * 구매요청 ID로 연결된 프로젝트 ID 조회
     * @param requestId 구매요청 ID
     * @return 프로젝트 ID (연결된 프로젝트가 없으면 null)
     */
    public Long getProjectIdByRequestId(Long requestId) {
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElse(null);

        if (request != null && request.getProject() != null) {
            return request.getProject().getId();
        }

        return null;
    }
}