package com.orbit.dto.approval;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalLineCreateDTO {
    @NotNull
    private Long purchaseRequestId;

    @NotEmpty
    private List<Long> approverIds; // 결재자 ID 목록 (순서대로)
}

