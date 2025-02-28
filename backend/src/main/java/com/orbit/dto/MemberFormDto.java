package com.orbit.dto;

import com.orbit.constant.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.Length;

/**
 * 회원가입 폼 DTO
 * - 회원가입 폼 데이터를 전달하는 DTO 클래스
 * - 서비스 레이어에서 Entity로 변환하여 저장되고
 *   서비스에서 전달받은 Entity를 컨트롤러로 전달할 때 사용.
 * - DTO는 Entity와 다르게 데이터 전달만을 위한 클래스이다.
 * - DTO는 Entity와 다르게 비즈니스 로직을 포함하지 않는다.
 * - 화면으로 전달되어 화면에 데이터를 표시하기 위한 클래스이다.
 */
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberFormDto {
    // 필드, 속성
    @NotBlank(message = "이름을 입력해주세요.")  // 공백도 안되고 null도 안됨
    private String name;
    /*
        * @NotBlank(message = "이메일을 입력해주세요.")
        * @Email(regexp = "이메일 정규식", message = "이메일 형식이 올바르지 않습니다.")
     */
    @NotBlank(message = "이메일을 입력해주세요.") // 공백도 안되고 null도 안됨
    @Email(regexp = "^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,6}$", message = "유효한 이메일 형식으로 입력해주세요.")
    private String email;

    @NotBlank(message = "비밀번호를 입력해주세요.") // 공백도 안되고 null도 안됨
    @Length(min = 4, max = 16, message = "비밀번호는 4자 이상 16자 이하로 입력해주세요.")
    private String password;

    @NotBlank(message = "주소를 입력해주세요.")
    private String address;

    @NotBlank(message = "연락처를 입력하세요.") // 공백도 안되고 null도 안됨
    @Pattern(
            regexp = "^010-\\d{4}-\\d{4}$",
            message = "Phone number should be in the format 010-XXXX-XXXX"
    )
    private String phone;
    private Role role;

}
