package com.orbit.dto.approval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionDTO {
    private Long id;

    @NotBlank(message = "직급명은 필수입니다")
    @Size(min = 1, max = 20, message = "직급명은 1-20자 이내여야 합니다")
    private String name;

    @NotNull(message = "직급 레벨은 필수입니다")
    @Min(value = 1, message = "직급 레벨은 1 이상이어야 합니다")
    private Integer level;

    private String description;
}