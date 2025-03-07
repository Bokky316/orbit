package com.orbit.config.jwt;

import com.orbit.entity.RefreshToken;
import com.orbit.service.RedisService;
import com.orbit.service.RefreshTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * 리프레시 토큰 체크 필터
 * - "/refresh" 요청이 들어왔을 때 실행되는 필터
 * - 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenCheckFilter extends OncePerRequestFilter {

    private final RedisService redisService; // Redis에서 권한 정보를 조회하기 위한 서비스
    private final TokenProvider tokenProvider; // JWT 토큰 생성 및 검증을 위한 서비스
    private final RefreshTokenService refreshTokenService; // 리프레시 토큰 관리 서비스

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refToken"; // 리프레시 토큰 쿠키 이름
    private static final String ACCESS_TOKEN_COOKIE_NAME = "accToken"; // 액세스 토큰 쿠키 이름

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // "/refresh" 요청이 아니면 다음 필터로 이동
        if (!"/refresh".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 1. 쿠키에서 리프레시 토큰 추출
        String refreshToken = extractTokenFromCookies(request.getCookies(), REFRESH_TOKEN_COOKIE_NAME);
        if (refreshToken == null) {
            handleErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "리프레시 토큰이 누락되었습니다.");
            return;
        }

        try {
            // 2. 리프레시 토큰 검증 및 갱신
            RefreshToken dbRefreshToken = refreshTokenService.validateAndRefreshToken(refreshToken);

            // 3. 리프레시 토큰에서 username 추출
            String username = tokenProvider.getUsernameFromToken(dbRefreshToken.getRefreshToken());

            // 4. Redis에서 권한 정보 조회
            List<String> roles = redisService.getUserAuthoritiesFromCache(username);
            if (roles == null || roles.isEmpty()) {
                handleErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Redis에서 권한 정보를 찾을 수 없습니다.");
                return;
            }
            log.info("Redis에서 조회한 권한 정보: {}", roles);

            // 5. 새로운 액세스 토큰 생성
            String newAccessToken = tokenProvider.generateToken(
                    username,
                    roles.stream().map(role -> new SimpleGrantedAuthority(role)).toList(),
                    Duration.ofMinutes(50) // 새 액세스 토큰 유효 시간
            );
            log.info("새로운 액세스 토큰 발급 완료: {}", newAccessToken);

            // 6. 새 액세스 토큰을 HttpOnly 쿠키로 저장
            response.addCookie(createCookie(ACCESS_TOKEN_COOKIE_NAME, newAccessToken));

            // 7. 리프레시 토큰이 갱신되었으면 새 리프레시 토큰을 쿠키에 저장
            if (!dbRefreshToken.getRefreshToken().equals(refreshToken)) {
                response.addCookie(createCookie(REFRESH_TOKEN_COOKIE_NAME, dbRefreshToken.getRefreshToken()));
                log.info("리프레시 토큰 쿠키 갱신 완료: {}", dbRefreshToken.getRefreshToken());
            }

            // 8. JSON 응답 반환
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(String.format(
                    "{\"message\":\"Access token refreshed successfully\",\"status\":\"success\",\"username\":\"%s\"}",
                    username
            ));
        } catch (IllegalArgumentException e) {
            handleErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다: " + e.getMessage());
        } catch (Exception e) {
            handleErrorResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "리프레시 토큰 검증 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * 쿠키에서 특정 이름의 토큰 추출
     *
     * @param cookies   요청에 포함된 쿠키 배열
     * @param tokenName 추출할 쿠키 이름
     * @return 추출된 쿠키 값 또는 null (쿠키가 없거나 이름이 일치하지 않을 경우)
     */
    private String extractTokenFromCookies(Cookie[] cookies, String tokenName) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (tokenName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null; // 쿠키가 없거나 이름이 일치하지 않는 경우 null 반환
    }

    /**
     * HttpOnly 쿠키 생성 메서드
     *
     * @param name  쿠키 이름
     * @param value 쿠키 값
     * @return 생성된 HttpOnly 쿠키 객체
     */
    private Cookie createCookie(String name, String value) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS 환경에서만 전송되도록 설정 (개발 환경에서는 false로 설정 가능)
        cookie.setPath("/");
        return cookie;
    }

    /**
     * 에러 응답 처리 메서드
     *
     * @param response HTTP 응답 객체
     * @param status   HTTP 상태 코드 (예: 401 Unauthorized)
     * @param message  에러 메시지 내용
     * @throws IOException 응답 작성 중 발생할 수 있는 예외
     */
    private void handleErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"error\":\"Unauthorized\",\"message\":\"%s\"}", message
        ));
        log.warn(message); // 로그에 경고 메시지 출력
    }
}
