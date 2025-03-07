package com.orbit.dto.supplier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SupplierRegistrationRequestDto {
    @NotNull(message = "회원 ID는 필수입니다.")
    private Long supplierId;

    @NotBlank(message = "사업자등록번호는 필수입니다.")
    private String businessNo;

    @NotBlank(message = "회사명은 필수입니다.")
    private String companyName;

    @NotBlank(message = "대표자명은 필수입니다.")
    private String ceoName;

    private String businessType; // 업태
    private String businessCategory; // 업종
    private String sourcingCategory; // 소싱대분류
    private String sourcingSubCategory; // 소싱중분류
    private String phoneNumber; // 전화번호
    private String headOfficeAddress; // 본사 주소
    private String comments; // 의견

    private MultipartFile businessFile; // 사업자등록증 파일 업로드
}
