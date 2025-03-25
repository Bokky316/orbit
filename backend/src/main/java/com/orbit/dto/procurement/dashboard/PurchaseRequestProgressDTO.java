package com.orbit.dto.procurement.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestProgressDTO {
    private String requestNumber;
    private String requestName;
    private String currentStatus;
    private List<String> completedSteps;    // 완료된 단계
    private List<String> pendingSteps;      // 대기중인 단계
    private String nextStep;                // 다음 단계
    private double completionPercentage;    // 완료율(%)
}