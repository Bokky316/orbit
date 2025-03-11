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
    private List<Long> approverIds;
    private String initialStatusCode;
}
