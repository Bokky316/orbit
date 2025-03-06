package com.orbit.config.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Header;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JWT 토큰 관련 기능을 제공하는 클래스
 */
@RequiredArgsConstructor
@Service
public class TokenProvider {

    private final JwtProperties jwtProperties;

    /**
     * 액세스 토큰 생성
     * - 사용자 ID(username)와 권한 정보를 포함하여 JWT를 생성합니다.
     * - 만료 시간은 Duration 객체로 받아서 설정합니다.
     *
     * @param username 사용자 ID(username)
     * @param authorities 사용자 권한 목록
     * @param expiredAt 토큰 만료 시간 (Duration)
     * @return 생성된 JWT 토큰 문자열
     */
    public String generateToken(String username, Collection<? extends GrantedAuthority> authorities, Duration expiredAt) {
        Date now = new Date(); // 현재 시간
        Date expiry = new Date(now.getTime() + expiredAt.toMillis()); // 만료 시간 계산

        // 권한 정보를 문자열로 변환
        String roles = authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        // JWT 생성
        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)   // 헤더 설정(TYPE: JWT)
                .setIssuer(jwtProperties.getIssuer())           // 발급자 설정
                .setIssuedAt(now)                               // 발급 시간
                .setExpiration(expiry)                          // 만료 시간
                .setSubject(username)                           // 주제(username)
                .claim("roles", roles)                          // 권한 정보 추가
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey()) // 서명
                .compact();                                     // JWT 생성
    }

    /**
     * 리프레시 토큰 생성
     * - 사용자 ID(username)를 기반으로 리프레시 토큰을 생성합니다.
     *
     * @param username 사용자 ID(username)
     * @param expiredAt 리프레시 토큰 만료 시간 (Duration)
     * @return 생성된 리프레시 토큰 문자열
     */
    public String generateRefreshToken(String username, Duration expiredAt) {
        Date now = new Date(); // 현재 시간
        Date expiry = new Date(now.getTime() + expiredAt.toMillis()); // 만료 시간 계산

        // 리프레시 토큰 생성
        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)   // 헤더 설정(TYPE: JWT)
                .setIssuer(jwtProperties.getIssuer())           // 발급자 설정
                .setIssuedAt(now)                               // 발급 시간
                .setExpiration(expiry)                          // 만료 시간
                .setSubject(username)                           // 주제(username)
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey()) // 서명
                .compact();                                     // JWT 생성
    }

    /**
     * 토큰 유효성 검사
     * - 주어진 토큰의 유효성을 검사합니다.
     *
     * @param token 검사할 JWT 토큰 문자열
     * @return 유효하면 true, 그렇지 않으면 false 반환
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .setSigningKey(jwtProperties.getSecretKey())
                    .parseClaimsJws(token);
            return true; // 유효한 경우 true 반환
        } catch (Exception e) {
            return false; // 유효하지 않은 경우 false 반환
        }
    }

    /**
     * 토큰에서 사용자 ID(username)를 추출합니다.
     *
     * @param token JWT 토큰 문자열
     * @return 추출된 사용자 ID(username)
     */
    public String getUsernameFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getSubject(); // subject에 저장된 username 반환
    }

    /**
     * 토큰에서 권한 정보를 추출합니다.
     *
     * @param token JWT 토큰 문자열
     * @return 권한 정보 리스트 (List<String>)
     */
    public List<String> getRolesFromToken(String token) {
        Claims claims = getClaims(token);
        String roles = claims.get("roles", String.class); // roles 클레임에서 권한 정보 추출

        if (roles == null || roles.isEmpty()) {
            return Collections.emptyList();
        }

        return Arrays.asList(roles.split(",")); // 쉼표로 구분된 권한 문자열을 리스트로 변환
    }

    /**
     * 토큰 만료 시간을 반환합니다.
     *
     * @param token JWT 토큰 문자열
     * @return 만료 시간 (Date 객체)
     */
    public Date getExpiration(String token) {
        Claims claims = getClaims(token);
        return claims.getExpiration();
    }

    /**
     * 주어진 JWT 토큰이 만료되었는지 확인합니다.
     *
     * @param token 검사할 JWT 토큰 문자열
     * @return 만료되었으면 true, 그렇지 않으면 false 반환
     */
    public boolean isTokenExpired(String token) {
        Date expiration = getExpiration(token);
        return expiration.before(new Date()); // 현재 시간보다 이전이면 만료됨
    }

    /**
     * 주어진 JWT 토큰이 특정 기간 내에 만료될 예정인지 확인합니다.
     *
     * @param token 검사할 JWT 토큰 문자열
     * @param duration 특정 기간 (Duration)
     * @return 특정 기간 내에 만료될 예정이면 true, 그렇지 않으면 false 반환
     */
    public boolean isTokenExpiringSoon(String token, Duration duration) {
        Date expiration = getExpiration(token);
        Date soon = new Date(System.currentTimeMillis() + duration.toMillis());
        return expiration.before(soon); // 특정 기간 내에 만료될 예정인지 확인
    }

    /**
     * 주어진 JWT 토큰에서 클레임(Claims)을 추출합니다.
     *
     * @param token JWT 토큰 문자열
     * @return 추출된 클레임 (Claims 객체)
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .setSigningKey(jwtProperties.getSecretKey())
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 토큰에서 사용자 ID를 추출합니다.
     *
     * @param token JWT 토큰 문자열
     * @return 추출된 사용자 ID (Long)
     */
    public Long getUserId(String token) {
        Claims claims = getClaims(token);
        return claims.get("id", Long.class);
    }
}
