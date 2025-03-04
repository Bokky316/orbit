package com.orbit.config.jwt;

import com.orbit.config.jwt.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Header;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class TokenProvider {

    private final JwtProperties jwtProperties;

    /**
     * 토큰 생성
     * - 토큰 생성에 필요한 정보를 준비해서 토큰 생성 메서드를 호출합니다.
     * - user 정보와 만료 시간을 받아 토큰을 생성한다.
     * - 현재 시간을 기준으로 만료 시간을 계산하여 토큰을 생성합니다.
     * - 만료 시간은 Duration 객체로 받아서 사용한다.
     * - 만료 시간은 현재 시간을 기준으로 더해준다.
     * @param expiredAt : 토큰의 만료 시간을 나타냅니다.
     * now.getTime() + expiredAt.toMillis() : 현재 시간을 기준으로 만료 시간을 계산합니다.
     */
    public String generateToken(String email
                                //, Collection<? extends GrantedAuthority> authorities
                                //, String name
            , Duration expiredAt) {

        Date now = new Date(); // 현재 시간
        Date expiry = new Date(now.getTime() + expiredAt.toMillis());   // 만료시간 : 현재시간 + 만료시간
        // 토큰 생성
        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)   // 헤더 설정(TYPE: JWT, ALG: HS256)
                .setIssuer(jwtProperties.getIssuer())           // 발급자(application.properties에서 저장해놓은 jwt.issuer)
                .setIssuedAt(now)                               // 발급 시간
                .setExpiration(expiry)                          // 만료 시간
                .setSubject(email)                              // 주제(사용자 이메일)
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey()) // 서명
                .compact();                                     // JWT 생성
    }

//    /**
//     * [미사용] 토큰 생성
//     * - 토큰의 만료 시간을 받아 토큰을 생성합니다.
//     * - 토큰의 발급 시간은 현재 시간을 사용합니다.
//     * - 토큰의 만료 시간은 Date 객체로 받아서 사용합니다.
//     * - User 객체를 받아서 토큰을 생성합니다. User 객체에서 id와 email을 받아서 토큰에 담습니다.
//     * - 토큰의 발급자는 jwtProperties에서 받아온 발급자를 사용합니다.
//     * - 토큰의 주제는 User 객체에서 받아온 email을 사용합니다.
//     * - 토큰의 id는 User 객체에서 받아온 id를 사용합니다.
//     * - 토큰의 서명은 jwtProperties에서 받아온 시크릿 키를 사용합니다.
//     * - expiry : 토큰의 만료 시간
//     * - Jwts : JWT를 생성하는 클래스
//     */
//    private String makeToken(Date expiry, Member user) {
//        Date now = new Date();
//        return Jwts.builder()
//                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)   // 헤더 설정(TYPE: JWT, ALG: HS256)
//                .setIssuer(jwtProperties.getIssuer()) // 발급자(properties에서 받아온 발급자)
//                .setIssuedAt(now)   // 토큰 발급 시간
//                .setExpiration(expiry)  // 토큰 만료 시간
//                .setSubject(user.getEmail())        // 토큰 주제, User 객체에서 받아온 email
//                .claim("id", user.getId())        // 토큰 id, User 객체에서 받아온 id
//                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey()) // 토큰 서명, 시크릿 키
//                .compact(); // 토큰 생성
//    }

    /**
     * 토큰 유효성 검사
     * - 토큰을 파싱하여 유효성을 검사합니다.
     * - 이 메소드는 언제 호출되나? 토큰을 검사할 때 호출됩니다.
     * - 클라이언트가 토큰을 전송하면 서버에서 토큰을 검사합니다. 이때 이 메소드를 호출합니다.
     * @param token
     */
    public boolean validateToken(String token) {
        try {
            // 유효성을 검사할 때 사용하는 시크릿 키는 jwtProperties에서 받아온 시크릿 키를 사용합니다.
            // parser() : token을 파싱하는 메소드, setSigningKey() : 토큰을 검사할 때 사용하는 시크릿 키를 설정하는 메소드
            // parseClaimsJws(token) : token을 파싱하여 클레임을 받아옵니다.
            Jwts.parser()
                    .setSigningKey(jwtProperties.getSecretKey())
                    .parseClaimsJws(token);
            return true;    // 토큰이 유효하다는 의미, true 반환
        } catch (Exception e) {
            return false;   // 토큰 파싱이 실패했다는 의미, 즉 토큰이 유효하지 않다는 의미, false 반환
        }
    }

    /**
     * 토큰에서 id를 추출합니다.
     * - 토큰을 파싱하여 id를 추출합니다.
     */
    public Long getUserId(String token) {
        Claims claims = getClaims(token);
        return claims.get("id", Long.class);
    }
    /**
     * 토큰을 파싱하여 클레임을 반환합니다.
     * - 토큰을 파싱하여 클레임을 반환합니다.
     * - parse() : 토큰을 파싱하는 메소드
     * - setSigningKey() : 토큰을 검사할 때 사용하는 시크릿 키(salt)를 설정하는 메소드
     * - parseClaimsJws : 토큰을 파싱하여 클레임을 반환하는 메소드
     * - getBody() : 토큰의 바디를 반환하는 메소드, 바디에는 토큰에 담긴 정보가 담겨있습니다.(이름, 권한 등)
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .setSigningKey(jwtProperties.getSecretKey())
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * 리프레시 토큰 생성
     * - email과 만료 시간을 받아 리프레시 토큰을 생성합니다.
     * @param email
     * @param expiredAt
     * @return
     */
    public String generateRefreshToken(String email, Duration expiredAt) {
        Date now = new Date(); // 현재 시간
        Date expiry = new Date(now.getTime() + expiredAt.toMillis()); // 만료 시간 계산

        // 리프레시 토큰 생성
        return Jwts.builder()
                .setHeaderParam(Header.TYPE, Header.JWT_TYPE)   // 헤더 설정(TYPE: JWT)
                .setIssuer(jwtProperties.getIssuer())           // 발급자 설정
                .setIssuedAt(now)                               // 발급 시간
                .setExpiration(expiry)                          // 만료 시간
                .setSubject(email)                              // 주제(email)
                .signWith(SignatureAlgorithm.HS256, jwtProperties.getSecretKey()) // 서명
                .compact();                                     // JWT 생성
    }

    /**
     * 리프레시 토큰에서 email 추출
     * - 리프레시 토큰을 파싱하여 email을 추출합니다.
     * @param token
     * @return
     */
    public String getEmailFromToken(String token) {
        Claims claims = getClaims(token); // 기존 메소드 활용
        return claims.getSubject(); // JWT의 subject로 설정된 email 반환
    }

    /**
     * 토큰 만료 시간 반환
     * - 주어진 JWT 토큰에서 만료 시간을 추출하여 반환합니다.
     * @param token JWT 토큰
     * @return Date 만료 시간
     */
    public Date getExpiration(String token) {
        Claims claims = getClaims(token); // JWT 클레임 추출
        return claims.getExpiration(); // 만료 시간 반환
    }

}
