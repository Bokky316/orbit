package com.orbit.dto.supplier;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
    @Pattern(regexp = "^\\d{3}-\\d{2}-\\d{5}$", message = "사업자등록번호는 '000-00-00000' 형식이어야 합니다.")
    private String businessNo;

    @NotBlank(message = "대표자명은 필수입니다.")
    private String ceoName;

    private String businessType; // 업태
    private String businessCategory; // 업종
    private String sourcingCategory; // 소싱대분류
    private String sourcingSubCategory; // 소싱중분류
    private String sourcingDetailCategory; // 소싱소분류 (추가)
    private String phoneNumber; // 전화번호
    private String headOfficeAddress; // 본사 주소
    private String comments; // 의견

    // 추가 필드
    private String contactPerson; // 담당자
    private String contactPhone; // 담당자 연락처
    private String contactEmail; // 담당자 이메일

    private String businessFilePath; // 🔹 파일 경로 추가
}