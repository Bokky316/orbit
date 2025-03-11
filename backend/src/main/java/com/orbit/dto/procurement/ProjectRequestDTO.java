package com.orbit.dto.procurement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ProjectRequestDTO {

    @NotBlank(message = "프로젝트명은 필수 입력 항목입니다")
    @Size(max = 200, message = "프로젝트명은 200자 이내로 입력해주세요")
    private String projectName;

    @Size(max = 50, message = "사업 분류는 50자 이내로 입력해주세요")
    private String businessCategory;

    @Size(max = 100, message = "고객사명은 100자 이내로 입력해주세요")
    private String clientCompany;

    @Size(max = 50, message = "계약 유형은 50자 이내로 입력해주세요")
    private String contractType;

    @NotNull(message = "총 예산은 필수 입력 항목입니다")
    @Positive(message = "총 예산은 양수여야 합니다")
    private Long totalBudget;

    @Size(max = 1000, message = "비고는 1000자 이내로 입력해주세요")
    private String remarks;

    @Valid
    @NotNull(message = "프로젝트 기간은 필수 입력 항목입니다")
    private PeriodDTO projectPeriod;

    @Pattern(regexp = "^PROJECT-STATUS-[A-Z_]+$",
            message = "잘못된 기본 상태 코드 형식입니다")
    private String basicStatus;

    @Pattern(regexp = "^PROJECT-PROCUREMENT-[A-Z_]+$",
            message = "잘못된 조달 상태 코드 형식입니다")
    private String procurementStatus;

    @Getter
    @Setter
    public static class PeriodDTO {
        @NotNull(message = "시작일은 필수 입력 항목입니다")
        private LocalDate startDate;

        @NotNull(message = "종료일은 필수 입력 항목입니다")
        private LocalDate endDate;
    }
}
