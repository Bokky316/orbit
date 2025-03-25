package com.orbit.repository.procurement;

import com.orbit.dto.procurement.dashboard.PurchaseRequestSummaryDTO;
import com.orbit.entity.procurement.PurchaseRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public class PurchaseRequestRepositoryCustomImpl implements PurchaseRequestRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Map<String, Long> countByStatus() {
        String jpql = "SELECT pr.status.childCode, COUNT(pr) FROM PurchaseRequest pr GROUP BY pr.status.childCode";
        List<Object[]> results = em.createQuery(jpql, Object[].class).getResultList();

        Map<String, Long> countMap = new HashMap<>();
        for (Object[] result : results) {
            countMap.put((String) result[0], (Long) result[1]);
        }
        return countMap;
    }

    @Override
    public Map<String, BigDecimal> sumBudgetByStatus() {
        String jpql = "SELECT pr.status.childCode, SUM(pr.businessBudget) FROM PurchaseRequest pr GROUP BY pr.status.childCode";
        List<Object[]> results = em.createQuery(jpql, Object[].class).getResultList();

        Map<String, BigDecimal> budgetMap = new HashMap<>();
        for (Object[] result : results) {
            budgetMap.put((String) result[0], (BigDecimal) result[1]);
        }
        return budgetMap;
    }

    @Override
    public Map<String, Long> countByDepartment() {
        String jpql = "SELECT pr.businessDepartment, COUNT(pr) FROM PurchaseRequest pr GROUP BY pr.businessDepartment";
        List<Object[]> results = em.createQuery(jpql, Object[].class).getResultList();

        Map<String, Long> countMap = new HashMap<>();
        for (Object[] result : results) {
            countMap.put((String) result[0], (Long) result[1]);
        }
        return countMap;
    }

    @Override
    public Map<String, BigDecimal> sumBudgetByDepartment() {
        String jpql = "SELECT pr.businessDepartment, SUM(pr.businessBudget) FROM PurchaseRequest pr GROUP BY pr.businessDepartment";
        List<Object[]> results = em.createQuery(jpql, Object[].class).getResultList();

        Map<String, BigDecimal> budgetMap = new HashMap<>();
        for (Object[] result : results) {
            budgetMap.put((String) result[0], (BigDecimal) result[1]);
        }
        return budgetMap;
    }

    @Override
    public List<PurchaseRequest> findWithFilters(String status, String department, LocalDate fromDate, LocalDate toDate, String projectId, String businessType) {
        StringBuilder jpql = new StringBuilder("SELECT pr FROM PurchaseRequest pr WHERE 1=1");
        Map<String, Object> parameters = new HashMap<>();

        if (status != null && !status.isEmpty()) {
            jpql.append(" AND pr.status.childCode = :status");
            parameters.put("status", status);
        }

        if (department != null && !department.isEmpty()) {
            jpql.append(" AND pr.businessDepartment = :department");
            parameters.put("department", department);
        }

        if (fromDate != null) {
            jpql.append(" AND pr.requestDate >= :fromDate");
            parameters.put("fromDate", fromDate);
        }

        if (toDate != null) {
            jpql.append(" AND pr.requestDate <= :toDate");
            parameters.put("toDate", toDate);
        }

        if (projectId != null && !projectId.isEmpty()) {
            jpql.append(" AND pr.project.id = :projectId");
            parameters.put("projectId", Long.valueOf(projectId));
        }

        if (businessType != null && !businessType.isEmpty()) {
            jpql.append(" AND pr.businessType = :businessType");
            parameters.put("businessType", businessType);
        }

        jpql.append(" ORDER BY pr.requestDate DESC");

        TypedQuery<PurchaseRequest> query = em.createQuery(jpql.toString(), PurchaseRequest.class);
        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        return query.getResultList();
    }

    @Override
    public BigDecimal sumTotalBudget() {
        String jpql = "SELECT SUM(pr.businessBudget) FROM PurchaseRequest pr";
        BigDecimal result = (BigDecimal) em.createQuery(jpql).getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal sumBudgetByStatusCategory(List<String> statusCodes) {
        if (statusCodes == null || statusCodes.isEmpty()) {
            return BigDecimal.ZERO;
        }

        String jpql = "SELECT SUM(pr.businessBudget) FROM PurchaseRequest pr WHERE pr.status.childCode IN :statusCodes";
        Query query = em.createQuery(jpql);
        query.setParameter("statusCodes", statusCodes);
        BigDecimal result = (BigDecimal) query.getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }

    @Override
    public List<PurchaseRequestSummaryDTO> findRecentRequests(int limit) {
        String jpql = "SELECT pr FROM PurchaseRequest pr ORDER BY pr.requestDate DESC";
        List<PurchaseRequest> requests = em.createQuery(jpql, PurchaseRequest.class)
                .setMaxResults(limit)
                .getResultList();

        return requests.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PurchaseRequestSummaryDTO> findPendingRequests(int limit) {
        // 처리 대기중인 상태 목록 (REQUESTED, RECEIVED 등)
        List<String> pendingStatuses = List.of("REQUESTED", "RECEIVED", "VENDOR_SELECTION");

        String jpql = "SELECT pr FROM PurchaseRequest pr WHERE pr.status.childCode IN :statuses ORDER BY pr.requestDate ASC";
        List<PurchaseRequest> requests = em.createQuery(jpql, PurchaseRequest.class)
                .setParameter("statuses", pendingStatuses)
                .setMaxResults(limit)
                .getResultList();

        return requests.stream()
                .map(this::convertToSummaryDTO)
                .collect(Collectors.toList());
    }

    // 엔티티를 SummaryDTO로 변환하는 메서드
    private PurchaseRequestSummaryDTO convertToSummaryDTO(PurchaseRequest request) {
        PurchaseRequestSummaryDTO dto = new PurchaseRequestSummaryDTO();
        dto.setId(request.getId());
        dto.setRequestNumber(request.getRequestNumber());
        dto.setRequestName(request.getRequestName());
        dto.setStatus(request.getStatus() != null ? request.getStatus().getChildCode() : null);
        dto.setStatusDisplayName(getStatusDisplayName(request.getStatus() != null ? request.getStatus().getChildCode() : null));
        dto.setRequestDate(request.getRequestDate());
        dto.setCustomer(request.getCustomer());
        dto.setBusinessDepartment(request.getBusinessDepartment());
        dto.setBusinessManager(request.getBusinessManager());
        dto.setBusinessBudget(request.getBusinessBudget());
        dto.setRequesterName(request.getMember() != null ? request.getMember().getName() : null);
        dto.setBusinessType(request.getBusinessType());
        dto.setBusinessTypeDisplayName(getBusinessTypeDisplayName(request.getBusinessType()));

        if (request.getProject() != null) {
            dto.setProjectId(request.getProject().getId().toString());
            dto.setProjectName(request.getProject().getProjectName());
        }

        return dto;
    }

    // 상태 코드에 따른 표시 이름 매핑
    private String getStatusDisplayName(String statusCode) {
        if (statusCode == null) return "알 수 없음";

        Map<String, String> statusMap = Map.of(
                "REQUESTED", "요청됨",
                "RECEIVED", "접수됨",
                "VENDOR_SELECTION", "업체선정",
                "CONTRACT_PENDING", "계약대기",
                "INSPECTION", "검수",
                "INVOICE_ISSUED", "인보이스발행",
                "PAYMENT_COMPLETED", "대금지급완료"
        );

        return statusMap.getOrDefault(statusCode, statusCode);
    }

    // 비즈니스 타입에 따른 표시 이름 매핑
    private String getBusinessTypeDisplayName(String businessType) {
        if (businessType == null) return "알 수 없음";

        Map<String, String> typeMap = Map.of(
                "SI", "시스템 통합",
                "MAINTENANCE", "유지보수",
                "GOODS", "물품"
        );

        return typeMap.getOrDefault(businessType, businessType);
    }
}