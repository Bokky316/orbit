package com.orbit.dto.approval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateStepDTO {

    @Min(value = 1, message = "단계는 1 이상이어야 합니다")
    private int step;

    @NotNull(message = "부서는 필수입니다")
    private DepartmentDTO department;

    @Min(value = 1, message = "최소 레벨은 1 이상이어야 합니다")
    private int minLevel;

    @Min(value = 1, message = "최대 레벨은 1 이상이어야 합니다")
    private int maxLevel;

    private String description;
}