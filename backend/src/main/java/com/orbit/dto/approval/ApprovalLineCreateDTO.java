package com.orbit.dto.approval;

import lombok.*;

import java.util.List;

// ApprovalLineCreateDTO.java
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalLineCreateDTO {
    private Long purchaseRequestId;
    private List<Long> approverIds;
    private String initialStatusCode;
    private Long templateId; // 템플릿 ID 추가
    private boolean includeRequesterAsApprover; // 기안자 포함 옵션 추가
}