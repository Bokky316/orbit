package com.orbit.dto.approval;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalProcessDTO {
    private String action; // "APPROVE" 또는 "REJECT"
    private String comment;
    private String nextStatusCode; // 다음 상태 코드 (예: "APPROVAL-STATUS-APPROVED")
}