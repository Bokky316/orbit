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

    private Long id; // 구매 요청 ID

    private String requestName; // 요청명

    private String requestNumber; // 요청 번호

    private String status; // 진행 상태

    private LocalDate requestDate; // 요청일

    private String customer; // 고객사

    private String businessDepartment; // 사업 부서

    private String businessManager; // 사업 담당자

    private String businessType; // 사업 구분

    private Long businessBudget; // 사업 예산

    private String specialNotes; // 특이 사항

    private String managerPhoneNumber; // 담당자 핸드폰 번호

    private LocalDate projectStartDate; // 사업 기간 (시작일)

    private LocalDate projectEndDate; // 사업 기간 (종료일)

    private String projectContent; // 사업 내용

    private String attachments; // 첨부 파일 목록
}
