package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    // 숫자 필드 검증
    @PositiveOrZero(message = "0 이상의 숫자 입력 필요")
    @Digits(integer=15, fraction=2, message = "최대 15자리 정수")
    private BigDecimal businessBudget;

    // 전화번호 검증
    @Pattern(regexp = "^[0-9]{10,11}$", message = "숫자만 입력해주세요")
    private String managerPhoneNumber;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectEndDate;

    private String projectContent; // 사업 내용

    private List<PurchaseRequestItemDTO> purchaseRequestItemDTOs; // 구매 요청 아이템 목록
}
