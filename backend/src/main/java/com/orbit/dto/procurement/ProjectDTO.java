package com.orbit.dto.procurement;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 프로젝트 정보를 전송하기 위한 데이터 전송 객체 (DTO)
 * 요청과 응답에 모두 사용됩니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {

    // 기본 식별자 (응답에만 사용)
    private Long id;
    private String projectIdentifier;

    // 기본 정보
    @NotBlank(message = "프로젝트명은 필수입니다")
    private String projectName;
    private String businessCategory;
    private Long totalBudget;
    private String requestDepartment;
    private Long requestDepartmentId;  // 부서 ID 추가
    private String budgetCode;
    private String remarks;

    // 요청자 정보 (응답에만 사용)
    private String requesterName;
    private Long requesterId;  // 요청자(담당자) ID 추가

    // 상태 정보
    private String basicStatus;

    // 프로젝트 기간
    @NotNull(message = "프로젝트 기간은 필수입니다")
    @Valid
    private PeriodInfo projectPeriod;

    // 업데이트 요청자 (업데이트 시 사용)
    private String updatedBy;

    // 첨부파일 (Multipart 요청 시 사용)
    private MultipartFile[] files;

    // 첨부파일 목록 (응답에만 사용)
    @Builder.Default
    private List<ProjectAttachmentDTO> attachments = new ArrayList<>();

    // 생성 및 수정 시간 (응답에만 사용)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 프로젝트 기간 정보
     */
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