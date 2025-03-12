package com.orbit.dto.approval;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineCreateDTO {
    private Long purchaseRequestId;
    private List<Long> approverIds;
    private String initialStatusCode; // 초기 상태 코드 추가 (예: "APPROVAL-STATUS-PENDING")
}