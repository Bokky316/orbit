package com.orbit.dto.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MemberUpdateDto {

    @NotBlank(message = "이름을 입력해주세요.")
    private String name;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(regexp = "^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,6}$", message = "유효한 이메일 형식으로 입력해주세요.")
    private String email;

    @NotBlank(message = "회사 이름을 입력해주세요.")
    private String companyName;

    @NotBlank(message = "연락처를 입력하세요.")
    @Pattern(
            regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$",
            message = "올바른 전화번호 형식이 아닙니다."
    )
    private String contactNumber;

    @NotBlank(message = "우편번호를 입력해주세요.")
    private String postalCode;

    @NotBlank(message = "도로명 주소를 입력해주세요.")
    private String roadAddress;

    @NotBlank(message = "상세 주소를 입력해주세요.")
    private String detailAddress;

    // 부서와 직책은 별도의 엔티티로 관리되므로 여기서는 제외합니다.
    // 필요한 경우 ID만 받아서 처리할 수 있습니다.
    // private Long departmentId;
    // private Long positionId;
}
