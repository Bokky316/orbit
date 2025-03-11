package com.orbit.dto.approval;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApprovalProcessDTO {
    @NotBlank
    private String action; // APPROVE/REJECT

    private String comment;
}
