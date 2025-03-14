package com.orbit.dto.approval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalTemplateDTO {

    private Long id;

    @NotBlank(message = "템플릿 이름은 필수입니다")
    @Size(min = 1, max = 50, message = "템플릿 이름은 1-50자 이내여야 합니다")
    private String name;

    private String description;

    private boolean active;

    @NotEmpty(message = "결재 단계가 하나 이상 필요합니다")
    @Valid
    private List<ApprovalTemplateStepDTO> steps;
}