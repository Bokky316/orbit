package com.orbit.security.handler;

import com.orbit.security.dto.MemberSecurityDto;
import com.orbit.service.RedisService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 로그아웃 성공 핸들러
 * - Redis에서 사용자 권한 정보 삭제
 * - 액세스 토큰 및 리프레시 토큰 쿠키 삭제
 * - 클라이언트에 로그아웃 성공 메시지 반환
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutSuccessHandler implements LogoutSuccessHandler {

    private final RedisService redisService;

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {

        if (authentication != null && authentication.getPrincipal() instanceof MemberSecurityDto) {
            MemberSecurityDto userDetails = (MemberSecurityDto) authentication.getPrincipal();

            // Redis에서 권한 정보 삭제
            redisService.removeUserAuthorities(userDetails.getUsername());     // email -> username으로 변경
            log.info("사용자 [{}]의 권한 정보가 Redis에서 삭제되었습니다.", userDetails.getUsername());   // email -> username으로 변경
        }

        // 액세스 토큰 쿠키 삭제
        deleteCookie(response, "accToken", "/");

        // 리프레시 토큰 쿠키 삭제
        deleteCookie(response, "refToken", "/refresh");

        // 로그아웃 성공 메시지 반환
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\": \"로그아웃 성공\"}");
    }

    /**
     * 쿠키 삭제 메서드
     * @param response HttpServletResponse 객체
     * @param name 쿠키 이름
     * @param path 쿠키 경로
     */
    private void deleteCookie(HttpServletResponse response, String name, String path) {
        Cookie cookie = new Cookie(name, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS 환경에서는 true로 설정
        cookie.setPath(path);
        cookie.setMaxAge(0); // 만료 시간 설정 (즉시 삭제)
        response.addCookie(cookie);
        log.info("쿠키 [{}]가 경로 [{}]에서 삭제되었습니다.", name, path);
    }
}
