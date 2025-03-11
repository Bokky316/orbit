package com.orbit.dto.supplier;

import com.orbit.entity.state.SystemStatus;
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

    private String supplierName; // 회사명

    private String businessNo; // 사업자등록번호

    private String businessCategory; // 업종

    private String businessFile; // 사업자등록증 파일 경로

    private SystemStatus status; // 상태 (SystemStatus 타입으로 변경)

    private LocalDate registrationDate; // 등록 요청일

    private String ceoName; // 대표자명

    private String businessType; // 업태

    private String sourcingCategory; // 소싱대분류

    private String sourcingSubCategory; // 소싱중분류

    private String phoneNumber; // 전화번호

    private String headOfficeAddress; // 본사 주소

    private String comments; // 의견

    // 상태 코드 및 이름 조회 편의 메서드 (클라이언트 표시용)
    private String getStatusCode() {
        return status != null ? status.getChildCode() : null;
    }

    private String getStatusFullCode() {
        return status != null ? status.getFullCode() : null;
    }

    /**
     * Entity -> DTO 변환 메서드
     */
    public static SupplierRegistrationResponseDto fromEntity(SupplierRegistration supplierRegistration) {
        return new SupplierRegistrationResponseDto(
                supplierRegistration.getId(),
                supplierRegistration.getSupplier().getCompanyName(),  // Member 엔티티의 회사명 참조
                supplierRegistration.getBusinessNo(),
                supplierRegistration.getBusinessCategory(),
                supplierRegistration.getBusinessFile(),
                supplierRegistration.getStatus(),
                supplierRegistration.getRegistrationDate(),
                supplierRegistration.getCeoName(),
                supplierRegistration.getBusinessType(),
                supplierRegistration.getSourcingCategory(),
                supplierRegistration.getSourcingSubCategory(),
                supplierRegistration.getPhoneNumber(),
                supplierRegistration.getHeadOfficeAddress(),
                supplierRegistration.getComments()
        );
    }
}