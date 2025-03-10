package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class MaintenanceRequestDTO extends PurchaseRequestDTO {
    @FutureOrPresent @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate contractStartDate;

    @Future @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate contractEndDate;

    @Positive
    private BigDecimal contractAmount;

    @NotBlank
    private String contractDetails;
}
