package com.orbit.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orbit.config.jwt.TokenProvider;
import com.orbit.security.dto.MemberSecurityDto;
import com.orbit.service.RedisService;
import com.orbit.service.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 로그인 성공 후처리 담당 클래스
 * - JWT 토큰을 생성하고, HttpOnly Cookie에 토큰을 담아 클라이언트에게 전달
 * - 클라이언트에게 로그인 성공 여부와 사용자 정보를 JSON 형식으로 전달
 */
@RequiredArgsConstructor
@Component
@Slf4j
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    private final RefreshTokenService refreshTokenService;
    private final TokenProvider tokenProvider;
    private final RedisService redisService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        log.info("CustomAuthenticationSuccessHandler - 로그인 성공. 요청 사용자: {}", request.getParameter("username"));

        MemberSecurityDto userDetails = (MemberSecurityDto) authentication.getPrincipal();
        String username = userDetails.getUsername();

        // Redis에 사용자 권한 정보 캐싱
        redisService.cacheUserAuthorities(username);
        log.info("사용자 [{}]의 권한 정보가 Redis에 저장되었습니다.", username);

        // 사용자 권한 목록을 가져옴 (이미 GrantedAuthority 형태로 변환되어 있음)
        Collection<? extends GrantedAuthority> authorities = userDetails.getAuthorities();

        // 권한 정보를 문자열 리스트로 변환 (JSON 응답용)
        List<String> roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        log.info("Authentication 객체에서 조회한 사용자 권한 정보: {}", roles);

        // 액세스 토큰(JWT) 생성
        String accessToken = tokenProvider.generateToken(
                username,
                authorities,
                Duration.ofMinutes(50)
        );

        // 리프레시 토큰 생성
        String refreshToken = tokenProvider.generateRefreshToken(
                username,
                Duration.ofDays(7)
        );

        // 리프레시 토큰을 DB에 저장
        refreshTokenService.saveOrUpdateRefreshToken(username, refreshToken, userDetails.getId());

        // 액세스 토큰을 HttpOnly Cookie로 저장
        addCookie(response, "accToken", accessToken, "/", (int) Duration.ofMinutes(50).getSeconds());

        // 리프레시 토큰을 HttpOnly Cookie로 저장
        addCookie(response, "refToken", refreshToken, "/refresh", (int) Duration.ofDays(7).plusMinutes(30).getSeconds());

        // JSON 응답 생성 및 반환
        sendJsonResponse(response, userDetails, roles);
    }

    private void addCookie(HttpServletResponse response, String name, String value, String path, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // HTTPS 환경에서는 true로 설정
        cookie.setPath(path);
        cookie.setMaxAge(maxAge);
        response.addCookie(cookie);
        log.info("{}이 HttpOnly 쿠키로 저장되었습니다.", name);
    }

    private void sendJsonResponse(HttpServletResponse response, MemberSecurityDto userDetails, List<String> roles) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("message", "로그인 성공");
        responseData.put("status", "success");
        responseData.put("id", userDetails.getId());
        responseData.put("username", userDetails.getUsername());
        responseData.put("name", userDetails.getRealName());
        responseData.put("email", userDetails.getEmail());
        responseData.put("companyName", userDetails.getCompanyName());
        responseData.put("contactNumber", userDetails.getContactNumber());
        responseData.put("postalCode", userDetails.getPostalCode());
        responseData.put("roadAddress", userDetails.getRoadAddress());
        responseData.put("detailAddress", userDetails.getDetailAddress());
        responseData.put("departmentId", userDetails.getDepartmentId());
        responseData.put("roles", roles);

        response.getWriter().write(objectMapper.writeValueAsString(responseData));
    }
}
