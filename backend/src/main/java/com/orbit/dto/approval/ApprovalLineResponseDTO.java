package com.orbit.dto.approval;

import java.time.LocalDateTime;

import com.orbit.entity.approval.ApprovalLine;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApprovalLineResponseDTO {
    private Long id;
    private String approverName;
    private String department;
    private Integer step;
    private ApprovalLine.ApprovalStatus status;
    private LocalDateTime approvedAt;
    private String comment;
}
