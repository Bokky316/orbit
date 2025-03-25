package com.orbit.dto.procurement.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestSummaryDTO {
    private Long id;
    private String requestNumber;
    private String requestName;
    private String status;
    private String statusDisplayName;
    private LocalDate requestDate;
    private String customer;
    private String businessDepartment;
    private String businessManager;
    private BigDecimal businessBudget;
    private String projectId;
    private String projectName;
    private String requesterName;
    private String businessType;
    private String businessTypeDisplayName;
}