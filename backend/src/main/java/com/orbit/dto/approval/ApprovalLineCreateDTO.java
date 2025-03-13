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
    private String initialStatusCode;
}