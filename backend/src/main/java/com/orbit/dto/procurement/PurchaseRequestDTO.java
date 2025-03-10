package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
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

    private String specialNotes; // 특이 사항

    private String managerPhoneNumber; // 담당자 핸드폰 번호

    @PositiveOrZero(message = "사업예산은 0 이상이어야 합니다.")
    private BigDecimal businessBudget; // Long → BigDecimal 변경

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectEndDate;

    private String projectContent; // 사업 내용

    private List<PurchaseRequestItemDTO> purchaseRequestItemDTOs; // 구매 요청 아이템 목록
}
