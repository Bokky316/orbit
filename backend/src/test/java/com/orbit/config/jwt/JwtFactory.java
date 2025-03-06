package com.orbit.config.jwt;

import io.jsonwebtoken.Header;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.Builder;
import lombok.Getter;

import java.time.Duration;
import java.util.Date;
import java.util.Map;

import static java.util.Collections.emptyMap;

/**
 * JWT 토큰을 생성하는 클래스
 * -
 */
@Getter
public class JwtFactory {
    // 토큰의 주제를 특정 이메일로 설정
    private String subject = "test@test.com";

    // 토큰 발급 시간은 현재 시간으로 설정
    private Date issuedAt = new Date();

    // 토큰의 만료 시간은 7일로 설정
    private Date expiration = new Date(new Date().getTime() + Duration.ofDays(7).toMillis());

    // 토큰에 담을 클레임 정보를 설정, 기본값은 빈 맵
    private Map<String, Object> claims = emptyMap();

    /*
        * 토큰 생성 메서드를 호출합니다.
        * @Builder : 빌더 패턴을 사용하여 객체를 생성합니다. 생성자에만 @Builder를 붙이면 생성자에만 전체 클래스가 아니고 생성자만 생성됩니다.
        * - subject : 토큰의 주제를 설정합니다.
        * - issuedAt : 토큰 발급 시간을 설정합니다.
        * - expiration : 토큰의 만료 시간을 설정합니다.
        * - claims : 토큰에 담을 클레임 정보를 설정합니다.
     */
    @Builder
    public JwtFactory(String subject, Date issuedAt, Date expiration,
                      Map<String, Object> claims) {
        this.subject = subject != null ? subject : this.subject;
        this.issuedAt = issuedAt != null ? issuedAt : this.issuedAt;
        this.expiration = expiration != null ? expiration : this.expiration;
        this.claims = claims != null ? claims : this.claims;
    }

    // 기본값을 사용하여 JwtFactory 객체를 생성합니다.
    public static JwtFactory withDefaultValues() {
        return JwtFactory.builder().build();
    }

    public String createToken(JwtProperties jwtProperties) {
        return Jwts.builder()
                .setSubject(subject)
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)
                .setIssuer(jwtProperties.getIssuer())
                .setIssuedAt(issuedAt)
                .setExpiration(expiration)
                .addClaims(claims)
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey())
                .compact();
    }
}

