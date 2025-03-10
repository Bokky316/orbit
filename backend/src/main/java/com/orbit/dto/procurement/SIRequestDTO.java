package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class SIRequestDTO extends PurchaseRequestDTO {
    @FutureOrPresent @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectStartDate;

    @Future @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate projectEndDate;

    @NotBlank @Size(max = 2000)
    private String projectContent;
}
