// ProjectResponseDTO.java
package com.orbit.dto.procurement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
public class ProjectResponseDTO {

    // 기본 식별자
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
