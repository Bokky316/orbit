package com.orbit.dto.supplier;

import com.orbit.constant.SupplierStatus;
import com.orbit.entity.supplier.SupplierRegistration;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegistrationResponseDto {
    private Long id;
    private String supplierName;
    private String businessNo;
    private String businessCategory;
    private String businessFile;
    private SupplierStatus status;
    private LocalDate registrationDate;

    public static SupplierRegistrationResponseDto fromEntity(SupplierRegistration supplierRegistration) {
        return new SupplierRegistrationResponseDto(
                supplierRegistration.getId(),
                supplierRegistration.getSupplier().getCompanyName(),
                supplierRegistration.getBusinessNo(),
                supplierRegistration.getBusinessCategory(),
                supplierRegistration.getBusinessFile(),
                supplierRegistration.getStatus(),
                supplierRegistration.getRegistrationDate()
        );
    }
}
