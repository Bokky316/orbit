package com.orbit.dto.procurement;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 결재 응답 DTO
 */
@Getter
@Setter
public class ApprovalResponseDTO {

    private Long id;

    private Long purchaseRequestId; // 구매 요청 ID

    private Long approverId; // 승인자 ID

    private LocalDate approvalDate; // 승인일

    private String status; // 상태 (대기, 승인, 거절)

    private String comments; // 의견
}
