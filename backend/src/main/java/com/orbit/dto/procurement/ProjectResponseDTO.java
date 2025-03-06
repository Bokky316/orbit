package com.orbit.dto.procurement;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 프로젝트 응답 DTO
 */
@Getter
@Setter
public class ProjectResponseDTO {
    private Long id;
    private String projectId;
    private String projectName;
    private String managerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String description;
}
