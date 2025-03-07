package com.orbit.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RefreshTokenDto {
    private String username;  // email -> username으로 변경
    private String refreshToken;
}
