package com.orbit.dto.procurement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequestDTO {

    // 기본 정보
    @NotBlank(message = "프로젝트명은 필수입니다")
    private String projectName;

    private String businessCategory;
    private Long totalBudget;
    private String clientCompany;
    private String contractType;
    private String requestDepartment;
    private String budgetCode;
    private String remarks;

    // 상태 정보
    private String basicStatus;
    private String procurementStatus;

    // 프로젝트 기간
    @NotNull(message = "프로젝트 기간은 필수입니다")
    @Valid
    private PeriodInfo projectPeriod;

    // 업데이트 요청자 (업데이트 시 사용)
    private String updatedBy;

    // 첨부파일 (Multipart 요청 시 사용)
    private MultipartFile[] files;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodInfo {
        @NotNull(message = "시작일은 필수입니다")
        private LocalDate startDate;

        @NotNull(message = "종료일은 필수입니다")
        private LocalDate endDate;
    }
}