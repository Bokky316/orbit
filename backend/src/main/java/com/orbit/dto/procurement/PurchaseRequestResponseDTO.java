package com.orbit.dto.procurement;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 구매 요청 응답 DTO
 */
@Getter
@Setter
public class PurchaseRequestResponseDTO {

    private Long id;

    private Long projectId; // 프로젝트 ID

    private String title; // 제목

    private String description; // 설명

    private Double totalAmount; // 총 금액

    private String status; // 상태 (초안, 제출, 승인, 거절, 완료)

    private LocalDate requestDate; // 요청일

    private LocalDate deliveryDate; // 납기일
}
