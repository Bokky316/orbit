package com.orbit.dto.approval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDTO {
    private Long id;
    private String name;
    private String code;
    private String description;

    // 직급 레벨 관련 필드
    private Integer teamLeaderLevel;
    private Integer middleManagerLevel;
    private Integer upperManagerLevel;
    private Integer executiveLevel;
}