package com.orbit.dto.member;

import org.hibernate.validator.constraints.Length;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * 회원 가입 폼 데이터를 전달하는 DTO
 */
@Getter
@Setter
public class MemberFormDto {

    @NotBlank(message = "아이디(username)를 입력해주세요.")
    private String username;

    @NotBlank(message = "이름을 입력해주세요.")
    private String name;

    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Length(min = 6, message = "비밀번호는 6자 이상 입력해주세요.")
    @Pattern(
        regexp = "^(?=.*[0-9])|(?=.*[a-zA-Z])|(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).*$", 
        message = "비밀번호는 영문, 숫자, 특수문자 중 적어도 1가지 이상을 포함해야 합니다."
    )
    private String password;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(regexp = "^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,6}$", message = "유효한 이메일 형식으로 입력해주세요.")
    private String email;

    @NotBlank(message = "회사 이름을 입력해주세요.")
    private String companyName;

    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다.")
    private String contactNumber;

    @NotBlank(message = "우편번호를 입력해주세요.")
    private String postalCode;

    @NotBlank(message = "도로명 주소를 입력해주세요.")
    private String roadAddress;

    @NotBlank(message = "상세 주소를 입력해주세요.")
    private String detailAddress;

    private String confirmPassword; // 비밀번호 확인 필드 추가
}
