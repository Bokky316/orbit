package com.orbit.dto.member;

import lombok.Getter;
import lombok.Setter;

/**
 * 로그인 폼 데이터를 전달하는 DTO
 */
@Getter
@Setter
public class LoginFormDto {

    private String username; // 사용자 ID

    private String password;
}
