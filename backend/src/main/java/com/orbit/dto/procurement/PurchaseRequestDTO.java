package com.orbit.dto.procurement;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 구매 요청 DTO
 */
@Getter
@Setter
public class PurchaseRequestDTO {

    private Long projectId; // 프로젝트 ID

    @NotBlank(message = "제목은 필수 입력 값입니다.")
    private String title; // 제목

    private String description; // 설명

    private LocalDate requestDate; // 요청일

    private LocalDate deliveryDate; // 납기일

    private String status; // 상태 (초안, 제출, 승인, 거절, 완료)
}
