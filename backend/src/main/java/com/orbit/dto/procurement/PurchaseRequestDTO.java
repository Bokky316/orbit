package com.orbit.dto.procurement;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * 구매 요청 DTO
 */
@Getter
@Setter
public class PurchaseRequestDTO {

    @NotBlank(message = "요청명은 필수 입력 값입니다.")
    private String requestName; // 요청명

    private LocalDate requestDate; // 요청일 (자동 생성)

    @NotBlank(message = "고객사는 필수 입력 값입니다.")
    private String customer; // 고객사

    @NotBlank(message = "사업 부서는 필수 입력 값입니다.")
    private String businessDepartment; // 사업 부서

    @NotBlank(message = "사업 담당자는 필수 입력 값입니다.")
    private String businessManager; // 사업 담당자

    private String businessType; // 사업 구분

    private Long businessBudget; // 사업 예산

    private String specialNotes; // 특이 사항

    private String managerPhoneNumber; // 담당자 핸드폰 번호

    private LocalDate projectStartDate; // 사업 기간 (시작일)

    private LocalDate projectEndDate; // 사업 기간 (종료일)

    private String projectContent; // 사업 내용

    private String attachments; // 첨부 파일 목록

    private List<PurchaseRequestItemDTO> purchaseRequestItemDTOs; // 구매 요청 아이템 목록
}
