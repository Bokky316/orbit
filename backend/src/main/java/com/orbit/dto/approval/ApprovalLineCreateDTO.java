package com.orbit.dto.approval;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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