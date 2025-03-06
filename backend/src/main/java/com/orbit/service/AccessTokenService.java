package com.orbit.service;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.dto.member.LoginFormDto;
import com.orbit.security.dto.MemberSecurityDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * AccessTokenService
 * - 로그인 시 AccessToken 생성을 위한 서비스
 */
@Service
@RequiredArgsConstructor
public class AccessTokenService {

    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;

    /**
     * AccessToken 생성
     * - 로그인 시도시 사용자 정보를 통해 AccessToken을 생성합니다.
     * @param loginForm 로그인 폼 데이터 (username, password)
     * @return 생성된 AccessToken
     */
    public String generateAccessToken(LoginFormDto loginForm) {
        // 로그인 시도시 사용할 UsernamePasswordAuthenticationToken 생성
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginForm.getUsername(), loginForm.getPassword()); // email -> username으로 변경

        // 토큰으로 인증을 시도하고 인증된 Authentication 객체를 반환
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        // MemberSecurityDto로 캐스팅
        MemberSecurityDto member = (MemberSecurityDto) authentication.getPrincipal();

        // 변경된 TokenProvider에 맞춰 파라미터 수정
        // 이제는 username과 만료시간만 전달
        return tokenProvider.generateToken(
                member.getUsername(),
                member.getAuthorities(),
                Duration.ofHours(1)
        );
    }
}