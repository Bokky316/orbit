package com.orbit.config.jwt;

import com.orbit.entity.Member;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Header;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;

@Service
public class TokenProvider {

    private final JwtProperties jwtProperties;
    private final SecretKey key;

    // 기본 생성자 추가
    public TokenProvider() {
        this.jwtProperties = null;
        this.key = null;
    }

    // 매개변수 있는 생성자
    public TokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;

        String secretKey = jwtProperties.getSecretKey();
        // 키 길이를 최소 32바이트로 보장
        secretKey = secretKey.length() < 32
                ? secretKey.repeat(32 / secretKey.length() + 1)
                : secretKey;
        secretKey = secretKey.substring(0, 32);

        // Base64 인코딩 대신 직접 바이트로 변환
        this.key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 토큰 생성
     */
    public String generateToken(String email, Duration expiredAt) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiredAt.toMillis());

        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)
                .setIssuer(jwtProperties.getIssuer())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .setSubject(email)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * [미사용] 토큰 생성
     */
    private String makeToken(Date expiry, Member user) {
        Date now = new Date();
        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)
                .setIssuer(jwtProperties.getIssuer())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .setSubject(user.getEmail())
                .claim("id", user.getId())
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 토큰 유효성 검사
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 토큰에서 id를 추출합니다.
     */
    public Long getUserId(String token) {
        Claims claims = getClaims(token);
        return claims.get("id", Long.class);
    }

    /**
     * 토큰을 파싱하여 클레임을 반환합니다.
     */
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 리프레시 토큰 생성
     */
    public String generateRefreshToken(String email, Duration expiredAt) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiredAt.toMillis());

        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)
                .setIssuer(jwtProperties.getIssuer())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .setSubject(email)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 리프레시 토큰에서 email 추출
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token);
        return claims.getSubject();
    }

    /**
     * 토큰 만료 시간 반환
     */
    public Date getExpiration(String token) {
        Claims claims = getClaims(token);
        return claims.getExpiration();
    }
}