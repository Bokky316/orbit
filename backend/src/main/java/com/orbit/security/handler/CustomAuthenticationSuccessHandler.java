package com.orbit.security.handler;

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
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 로그인 성공 후처리 담당 클래스
 * - JWT 토큰을 생성하고, HttpOnly Cookie에 토큰을 담아 클라이언트에게 전달
 * - 클라이언트에게 로그인 성공 여부와 사용자 정보를 JSON 형식으로 전달
 * - 리액트 로그인 컴포넌트에서 이를 받아서 사용자 정보를 리덕스에 저장.
 * - "message"와 "status" 필드를 통해 로그인 결과를 명확하게 전달합니다. 이는 클라이언트 측에서 로그인 성공을 확실히 인지하고 적절한 조치를 취할 수 있도록 돕습니다.
 * - 기본 리다이렉션 대신 JSON 응답을 보냄으로써, 클라이언트 측에서 로그인 성공 후의 동작을 더 유연하게 제어할 수 있습니다.
 * - 전통적인 세션 기반 인증 대신 토큰 기반 인증(예: JWT)을 사용할 때 유용
 */
@RequiredArgsConstructor
@Component
@Slf4j
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    private final RefreshTokenService refreshTokenService;
    private final TokenProvider tokenProvider;
    private final RedisService redisService;

    /**
     * 로그인 성공 후처리 메서드
     * - 로그인 성공 후 호출되는 메서드
     * - 이 메소드가 호출되는 시점은 로그인 처리가 정상적으로 완료되고 인증 객체가 생성된 직후입니다.
     * - 인증 객체에서 사용자 정보를 추출하여 액세스 토큰과 리프레시 토큰을 생성하고, HttpOnly 쿠키에 저장하여 클라이언트에게 전달합니다.
     * - 사용자의 권한 정보를 Redis에 캐싱합니다.
     * @param request : 요청 객체로 사용자가 입력한 아이디나 비밀번호
     * @param authentication : 인증 객체(사용자 정보)
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        log.info("CustomAuthenticationSuccessHandler - 로그인 성공. 요청 사용자: {}", request.getParameter("username"));

        // 1. 사용자 정보를 Authentication 객체에서 추출.
        // 이렇게 추출할 수 있는 이유는 이미 로그인 과정에서 인증이 끝나고 인증 객체가 생성되었기 때문입니다.
        MemberSecurityDto userDetails = (MemberSecurityDto) authentication.getPrincipal();

        // 2. Redis에 사용자 권한 정보 캐싱(이메일을 전달하면 권한 정보를 데이터베이스에서 조회한 뒤 Redis에 저장)
        redisService.cacheUserAuthorities(userDetails.getEmail());
        log.info("사용자의 권한 정보가 Redis에 성공적으로 저장되었습니다.");

        // redis에 저장된 사용자 권한 정보 확인하기 위한 로그
        log.info("사용자 [{}]의 권한 정보가 Redis에 저장되었습니다.", redisService.getUserAuthoritiesFromCache(userDetails.getEmail()));

        // 3️⃣ 사용자 권한 목록을 문자열로 변환
        //String roles = userDetails.getAuthorities().toString(); // 권한 목록을 문자열로 변환
        // 3️⃣ 사용자 권한 목록을 문자열로 변환
        List<String> roles = userDetails.getAuthorities().stream()
                .map(authority -> authority.getAuthority()) // 권한 문자열 추출
                .collect(Collectors.toList());
        log.info("Authentication 객체에서 조회한 사용자 권한 정보: {}", roles);

        // 4️⃣ 액세스 토큰(JWT) 생성
        String accessToken = tokenProvider.generateToken(
                userDetails.getEmail(),
                //userDetails.getAuthorities(), // 인증 객체에서 권한 정보 사용
                //userDetails.getRealName(),  // 사용자 이름
                Duration.ofMinutes(50) // 액세스 토큰 유효 시간, 5분
        );

        // 5️⃣ 리프레시 토큰 생성
        String refreshToken = tokenProvider.generateRefreshToken(
                userDetails.getEmail(),
                Duration.ofDays(7) // 리프레시 토큰 유효 기간 7일
        );

        // 6️⃣ 리프레시 토큰을 DB에 저장
        refreshTokenService.saveOrUpdateRefreshToken(userDetails.getEmail(), refreshToken);

        // 7️⃣ 액세스 토큰을 HttpOnly Cookie로 저장
        Cookie accessTokenCookie = new Cookie("accToken", accessToken);
        accessTokenCookie.setHttpOnly(true); // HttpOnly 속성 설정
        accessTokenCookie.setSecure(false); // HTTPS 환경에서는 true로 설정
        accessTokenCookie.setPath("/"); // 전체 경로에서 액세스 토큰을 서버로 전송
        response.addCookie(accessTokenCookie);  // 응답에 쿠키 추가, 사용자의 웹브라우저에 쿠키가 저장.
        log.info("액세스 토큰이 HttpOnly 쿠키로 저장되었습니다.");

        // 8️⃣ 리프레시 토큰을 HttpOnly Cookie로 저장
        Cookie refreshTokenCookie = new Cookie("refToken", refreshToken);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(false);
        refreshTokenCookie.setPath("/refresh"); // /refresh 경로에만 리프레시 토큰 포함해서 서버로 요청이 간다.
        refreshTokenCookie.setMaxAge((int) Duration.ofDays(7).plusMinutes(30).getSeconds()); // 만료 시간 7일 + 30분
        response.addCookie(refreshTokenCookie);
        log.info("리프레시 토큰이 HttpOnly 쿠키로 저장되었습니다.");

        // 9️⃣ JSON 응답 생성 및 반환, 여기서 반환된 사용자 정보가 리덕스 스토어의 상태로 저장됨.
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(String.format(
                "{\"message\":\"로그인 성공\",\"status\":\"success\",\"id\":%d,\"email\":\"%s\",\"name\":\"%s\",\"roles\":\"%s\"}",
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getRealName(),
                roles
        ));
    }
}
