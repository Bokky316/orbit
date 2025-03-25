package com.orbit.dto.dashboard;

import java.math.BigDecimal;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestStatsDTO {
    private Long totalRequests;
    private Long inProgressRequests;
    private Long completedRequests;
    private Long rejectedRequests;
    private BigDecimal totalRequestAmount;
    private BigDecimal inProgressAmount;
    private BigDecimal completedAmount;
}