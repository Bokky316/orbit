package com.orbit.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginFormDto {
    private String username;  // email -> username으로 변경
    private String password;
}
