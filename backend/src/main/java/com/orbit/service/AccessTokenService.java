package com.orbit.service;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.dto.LoginFormDto;
import com.orbit.entity.Member;
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
 *
 */
@Service
@RequiredArgsConstructor
public class AccessTokenService {

    private final AuthenticationManager authenticationManager;
    private final TokenProvider tokenProvider;

    /**
     * AccessToken 생성
     * - 로그인 시도시 사용자 정보를 통해 AccessToken을 생성합니다.
     * @param loginForm
     * @return
     */
    public String generateAccessToken(LoginFormDto loginForm) {
        // 로그인 시도시 사용할 UsernamePasswordAuthenticationToken 생성(여기에는 이메일과 비밀번호가 들어감)
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginForm.getEmail(), loginForm.getPassword());

        // 토큰으로 인증을 시도하고 인증된 Authentication 객체를 반환
        Authentication authentication = authenticationManager.authenticate(authenticationToken);

        // MemberSecurityDto로 캐스팅
        MemberSecurityDto member = (MemberSecurityDto) authentication.getPrincipal();

        // 변경된 TokenProvider에 맞춰 파라미터 수정
        // 이제는 이메일과 만료시간만 전달
        return tokenProvider.generateToken(
                member.getEmail(),
                Duration.ofHours(1) // 만료 시간 설정
        );
    }
}