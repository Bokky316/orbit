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

    private String businessCategory;

    private MultipartFile businessFile; // 사업자등록증 파일 업로드
}
