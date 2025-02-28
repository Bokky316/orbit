package com.orbit.config.jwt;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.Ordered;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.orbit.service.RedisService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 액세스 토큰 인증 필터
 * - Spring Security의 요청 필터로 동작한다.
 * - 요청마다 JWT 토큰을 검증하고 인증 객체를 SecurityContext에 저장하는 역할.
 * - 시큐리티의 정상적인 동작 보다 먼저 실행되어야 한다.
 * 그래서 SecurityConfig에서 addFilterBefore() 메소드로 등록한다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenAuthenticationFilter extends OncePerRequestFilter {
    private final RedisService redisService;
    private final TokenProvider tokenProvider;
    private final static String COOKIE_NAME = "accToken"; // 쿠키 이름으로 토큰 가져옴

    // 필터 순서를 명시적으로 지정하는 메서드 추가
    public int getFilterOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10; // 상대적으로 높은 우선순위 부여
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        log.info("TokenAuthenticationFilter.doFilterInternal 시작 - 요청 URI: {}", request.getRequestURI());

      /*  // Swagger 및 로그인/특정 경로는 필터 건너뛰기
        String path = request.getRequestURI();
        if (path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs") ||
                path.equals("/api/auth/login") || path.equals("/api/auth/userInfo") ||
                path.equals("/api/members/register") || path.equals("/api/members/checkEmail") ||
                path.equals("/api/item/list") || path.equals("/api/item/view/**") ||
                path.equals("/ping.js") ||
                path.startsWith("/ws") || path.startsWith("/ws/info") ||
                path.startsWith("/topic/chat/")|| path.startsWith("/api/notices")|| path.startsWith("/api/posts")) {

            filterChain.doFilter(request, response);
            return;
        }*/
        

        // Swagger 및 로그인/특정 경로는 필터 건너뛰기
        String path = request.getRequestURI();

        // 필터를 건너뛰어야 할 경로 목록
        Set<String> bypassPathsExact = Set.of(   // 정확히 일치해야 하는 경로
                "/api/auth/login", "/api/auth/userInfo",
                "/api/users/register", "/api/users/checkEmail",
                "/ping.js"
        );

        Set<String> bypassPathsStartsWith = Set.of(   // 접두사로 시작해야 하는 경로
                "/swagger-ui", "/v3/api-docs", "/ws", "/ws/info",
                "/topic/chat/", "/images/"

        );

        // 정확히 일치하는 경로 확인
        if (bypassPathsExact.contains(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // 접두사로 시작하는 경로 확인
        if (bypassPathsStartsWith.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }


        // 1. 쿠키에서 액세스 토큰 추출
        String token = extractTokenFromCookies(request.getCookies());
        log.info("TokenAuthenticationFilter에서 추출한 쿠키 토큰: {}", token);

        // 2. 토큰 검증
        if (token == null || !tokenProvider.validateToken(token)) {
            String errorMessage = token == null
                    ? "인증 토큰이 누락되었습니다."
                    : "액세스 토큰이 만료되었습니다.";
            handleUnauthorizedResponse(response, errorMessage);
            return;
        }

        // 3. 토큰에서 이메일 추출
        String email = tokenProvider.getEmailFromToken(token);
        log.info("토큰에서 추출한 이메일: {}", email);

        // 4. 위에서 추출한 이메일로 Redis에서 권한 정보 조회
        List<String> roles = redisService.getUserAuthoritiesFromCache(email);
        if (roles == null || roles.isEmpty()) {
            handleUnauthorizedResponse(response, "Redis에서 권한 정보를 찾을 수 없습니다.");
            return;
        }
        log.info("Redis에서 조회한 권한 정보: {}", roles);

        // 5. Redis 권한 정보로 인증 객체 생성, 인증 객체를 SecurityContext 세팅
        Set<SimpleGrantedAuthority> authorities = roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        log.info("Redis 권한 정보로 생성된 인증 객체: {}", auth);

        // 6. 인증 객체를 SecurityContext 세팅
        SecurityContextHolder.getContext().setAuthentication(auth);

        // 7. 다음 필터로 요청 전달, 더이상 필터가 없으면 사용자 원하는 요청을 처리
        filterChain.doFilter(request, response);
    }

    /**
     * 쿠키에서 JWT 토큰 추출
     */
    private String extractTokenFromCookies(Cookie[] cookies) {
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    log.info("쿠키에서 토큰 추출: {}", cookie.getValue());
                    return cookie.getValue(); // 쿠키 값 반환
                }
            }
        }
        return null;
    }

    /**
     * 401 Unauthorized 응답 처리
     */
    private void handleUnauthorizedResponse(HttpServletResponse response, String errorMessage) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 상태 코드 설정
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        // 사용자에게 명확한 오류 메시지 전달
        response.getWriter().write(String.format(
                "{\"error\":\"Unauthorized\",\"message\":\"%s\"}", errorMessage));
        log.warn("401 Unauthorized 응답 반환 - {}", errorMessage);
    }

}
