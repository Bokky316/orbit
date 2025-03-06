package com.orbit.dto;

import com.orbit.entity.member.Member;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.hibernate.validator.constraints.Length;

/**
 * 회원가입 폼 DTO (Data Transfer Object)
 * - 회원가입 시 클라이언트로부터 받은 데이터를 서버로 전달하는 객체
 * - 서비스 레이어에서 이 DTO를 사용하여 Member 엔티티를 생성하고 저장
 * - 컨트롤러와 서비스 계층 사이에서 데이터를 전달하는 역할
 * - 화면에 표시할 데이터를 담아 뷰로 전달하는 데도 사용
 * - 엔티티와 달리 비즈니스 로직을 포함하지 않으며, 순수하게 데이터 전달만을 목적으로 함
 */
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberFormDto {
    /**
     * 사용자 ID (로그인 시 사용)
     */
    @NotBlank(message = "사용자 ID를 입력해주세요.")
    @Length(min = 4, max = 50, message = "사용자 ID는 4자 이상 50자 이하로 입력해주세요.")
    private String username;

    /**
     * 사용자 실제 이름
     */
    @NotBlank(message = "이름을 입력해주세요.")
    @Length(max = 50, message = "이름은 50자 이하로 입력해주세요.")
    private String name;

    /**
     * 비밀번호
     */
    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Length(min = 4, max = 16, message = "비밀번호는 4자 이상 16자 이하로 입력해주세요.")
    private String password;

    /**
     * 이메일 주소
     */
    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(regexp = "^[\\w.%+-]+@[\\w.-]+\\.[a-zA-Z]{2,6}$", message = "유효한 이메일 형식으로 입력해주세요.")
    private String email;

    /**
     * 회사명
     */
    @NotBlank(message = "회사명을 입력해주세요.")
    @Length(max = 100, message = "회사명은 100자 이하로 입력해주세요.")
    private String companyName;

    /**
     * 연락처
     */
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "연락처는 xxx-xxxx-xxxx 형식으로 입력해주세요.")
    private String contactNumber;

    /**
     * 주소
     */
    private String address;

    /**
     * 사용자 역할 (BUYER, SUPPLIER, ADMIN)
     */
    private Member.Role role;

    // Department와 Position은 별도의 선택 로직이 필요할 수 있으므로 여기서는 제외했습니다.
    // 필요하다면 Long 타입의 deptId와 positionId를 추가할 수 있습니다.
}
