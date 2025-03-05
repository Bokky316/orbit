package com.orbit.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 프로젝트 생성 및 수정 요청 DTO
 */
@Getter
@Setter
public class ProjectRequestDTO {

    /**
     * 프로젝트 ID
     */
    @NotBlank(message = "프로젝트 ID는 필수 입력 값입니다.")
    @Size(max = 20, message = "프로젝트 ID는 20자 이내로 입력해주세요.")
    private String projectId;

    /**
     * 프로젝트 이름
     */
    @NotBlank(message = "프로젝트 이름은 필수 입력 값입니다.")
    @Size(max = 100, message = "프로젝트 이름은 100자 이내로 입력해주세요.")
    private String projectName;

    /**
     * 담당자 이름
     */
    @NotBlank(message = "담당자 이름은 필수 입력 값입니다.")
    @Size(max = 50, message = "담당자 이름은 50자 이내로 입력해주세요.")
    private String managerName;

    /**
     * 프로젝트 시작일
     */
    private LocalDate startDate;

    /**
     * 프로젝트 종료일
     */
    private LocalDate endDate;

    /**
     * 프로젝트 상태
     */
    private String status;

    /**
     * 프로젝트 설명
     */
    private String description;
}
