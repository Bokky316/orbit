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
    private List<Long> approverIds;
    private String initialStatusCode;
}
