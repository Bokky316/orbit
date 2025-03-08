// ProjectResponseDTO.java
package com.orbit.dto.procurement;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
public class ProjectResponseDTO {
    private Long id;
    private String projectIdentifier;
    private String projectName;
    private String businessCategory;
    private String basicStatus;
    private String procurementStatus;
    private ManagerInfo projectManager;
    private PeriodInfo projectPeriod;
    private Long totalBudget;
    private String clientCompany;
    private String contractType;
    private LocalDate registrationDate;

    @Getter @Setter
    public static class ManagerInfo {
        private String name;
        private String contact;
        private String email;
    }

    @Getter @Setter
    public static class PeriodInfo {
        private LocalDate startDate;
        private LocalDate endDate;
    }
}
