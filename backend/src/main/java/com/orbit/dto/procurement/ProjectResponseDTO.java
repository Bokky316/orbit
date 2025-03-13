package com.orbit.dto.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponseDTO {

    // 기본 식별자
    private Long id;
    private String projectIdentifier;

    // 기본 정보
    private String projectName;
    private String businessCategory;
    private Long totalBudget;
    private String clientCompany;
    private String contractType;
    private String requestDepartment;
    private String budgetCode;
    private String remarks;

    // 요청자 정보
    private String requesterName;

    // 상태 정보
    private String basicStatus;

    // 프로젝트 기간
    private PeriodInfo projectPeriod;

    // 첨부파일 목록
    private List<ProjectAttachmentDTO> attachments = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodInfo {
        private LocalDate startDate;
        private LocalDate endDate;
    }
}