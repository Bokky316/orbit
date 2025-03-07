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

    private Long requesterId; // 등록자 ID (Member 엔티티와 연결)

    // 이미지, OCR 정보 기반 폼 필드 추가 (PurchaseRequest 테이블로 이동)
    private String department; // 사업부서
    private String projectManager; // 사업담당자
    private String managerPhone; // 담당자핸드폰
    private String specialNotes; // 특기사항
    private String contractPeriod; // 계약기간
    private String contractAmount; // 계약금액
    private String contractDetails; // 계약내용
}
