package com.orbit.dto.approval;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineResponseDTO {
    private Long id;
    private Long purchaseRequestId;
    private String approverName;
    private String department;
    private Integer step;

    // ChildCode 대신 코드 값과 설명만 포함
    private String statusCode;  // 예: 'IN_REVIEW'
    private String statusName;  // 예: '검토 중'

    private LocalDateTime approvedAt;
    private String comment;
}
