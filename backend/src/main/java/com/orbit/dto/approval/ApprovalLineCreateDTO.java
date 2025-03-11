package com.orbit.dto.approval;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ApprovalLineCreateDTO {
    @NotNull
    private Long purchaseRequestId;

    @NotEmpty
    private List<Long> approverIds; // 결재자 ID 목록 (순서대로)
}

