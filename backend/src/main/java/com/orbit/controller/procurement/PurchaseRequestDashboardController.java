package com.orbit.controller.procurement;

import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestDashboardDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestProgressDTO;
import com.orbit.service.procurement.PurchaseRequestDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/purchase-requests/dashboard")
@RequiredArgsConstructor
public class PurchaseRequestDashboardController {

    private final PurchaseRequestDashboardService dashboardService;

    /**
     * 대시보드 데이터 조회
     */
    @GetMapping
    public ResponseEntity<PurchaseRequestDashboardDTO> getDashboard() {
        PurchaseRequestDashboardDTO dashboard = dashboardService.getDashboardData();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * 필터링된 구매요청 목록 조회
     */
    @GetMapping("/filter")
    public ResponseEntity<List<PurchaseRequestDTO>> getFilteredRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String businessType) {

        List<PurchaseRequestDTO> filteredData = dashboardService.getFilteredRequests(
                status, department, fromDate, toDate, projectId, businessType);
        return ResponseEntity.ok(filteredData);
    }

    /**
     * 프로젝트별 구매요청 목록 조회
     */
    @GetMapping("/by-project/{projectId}")
    public ResponseEntity<List<PurchaseRequestDTO>> getRequestsByProject(@PathVariable Long projectId) {
        List<PurchaseRequestDTO> requests = dashboardService.getRequestsByProject(projectId);
        return ResponseEntity.ok(requests);
    }

    /**
     * 구매요청 진행 상태 조회
     */
    @GetMapping("/{requestId}/progress")
    public ResponseEntity<PurchaseRequestProgressDTO> getRequestProgress(@PathVariable Long requestId) {
        PurchaseRequestProgressDTO progress = dashboardService.getRequestProgress(requestId);
        return ResponseEntity.ok(progress);
    }

    /**
     * 전체 부서 목록 조회
     */
    @GetMapping("/departments")
    public ResponseEntity<List<String>> getAllDepartments() {
        List<String> departments = dashboardService.getAllDepartments();
        return ResponseEntity.ok(departments);
    }

    /**
     * 전체 상태 목록 조회
     */
    @GetMapping("/statuses")
    public ResponseEntity<List<String>> getAllStatusCodes() {
        List<String> statusCodes = dashboardService.getAllStatusCodes();
        return ResponseEntity.ok(statusCodes);
    }
}