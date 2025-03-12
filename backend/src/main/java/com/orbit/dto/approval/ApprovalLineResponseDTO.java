package com.orbit.dto.approval;

import java.time.LocalDateTime;

import com.orbit.entity.commonCode.ChildCode;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineResponseDTO {
    private Long id;
    private Long purchaseRequestId;
    private String approverName;
    private String department;
    private Integer step;

    // ChildCode로 변경
    private ChildCode status;

    private LocalDateTime approvedAt;
    private String comment;
}
