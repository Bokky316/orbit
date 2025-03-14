package com.orbit.entity.procurement;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.Lob;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@DiscriminatorValue("MAINTENANCE")
@Getter
@Setter
public class MaintenanceRequest extends PurchaseRequest {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate contractStartDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate contractEndDate;

    @Positive(message = "계약 금액은 양수여야 합니다")
    @Column(precision = 19, scale = 2)
    private BigDecimal contractAmount;

    @Lob
    @Column(length = 2000)
    private String contractDetails;
}