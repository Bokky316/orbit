// ProjectRequestDTO.java
package com.orbit.dto.procurement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class ProjectRequestDTO {

    @NotBlank @Size(max = 200)
    private String projectName;

    @Size(max = 50)
    private String businessCategory;

    @Pattern(regexp = "^[A-Z]+-[A-Z_]+$")
    private String basicStatus;

    @Pattern(regexp = "^[A-Z]+-[A-Z_]+$")
    private String procurementStatus;

    @Valid @NotNull
    private ManagerDTO projectManager;

    @Valid @NotNull
    private PeriodDTO projectPeriod;

    @NotNull
    private Long totalBudget;

    @Size(max = 100)
    private String clientCompany;

    @Size(max = 50)
    private String contractType;

    @Getter @Setter
    public static class ManagerDTO {
        @NotBlank @Size(max = 50)
        private String name;

        @Size(max = 20)
        private String contact;

        @Email @Size(max = 100)
        private String email;
    }

    @Getter @Setter
    public static class PeriodDTO {
        @NotNull
        private LocalDate startDate;

        @NotNull
        private LocalDate endDate;
    }
}

