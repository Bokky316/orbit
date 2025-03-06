package com.orbit.config.jwt;

import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import io.jsonwebtoken.Jwts;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Duration;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Slf4j
@Transactional
class TokenProviderTest {

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * 토큰 생성 메소드 테스트
     */
    @DisplayName("generateToken(): 유저 정보와 만료 기간을 전달해 토큰을 만들 수 있다.")
    @Test
    void generateToken() {
        // given, 회원 저장, 이렇게 저장한 회원 정보로 토큰을 생성한다.
        Member testUser = memberRepository.save(Member.builder()
                .username("testuser")    // DB에 없는 이메일로 테스트 -> username으로 변경
                .password("1234")
                .email("test@test.com")    // 이메일 추가
                .name("Test User") // 이름 추가
                .build());

        // when, 토큰 생성, 회원 정보와 만료 기간을 전달해 토큰을 생성한다. ofDays(14) : 14일
        String token = tokenProvider.generateToken(testUser.getUsername(), testUser.getAuthorities(), Duration.ofDays(7)); // username, authorities 추가
        log.info("token: " + token);

        // then, 위에서 생성한 토큰 검증, 토큰을 파싱(암호해독, 복호화)해서 회원 정보를 가져온다.
        String username = Jwts.parser()
                .setSigningKey(jwtProperties.getSecretKey()) //  토큰을 생성할 때 사용한 시크릿 키를 사용해 토큰을 파싱한다.
                .parseClaimsJws(token)  // 토큰을 파싱한다.
                .getBody()  // 토큰의 바디를 가져온다.
                .getSubject(); // 토큰의 바디에서 subject를 가져온다. 이때 subject는 username이다.

        // 토큰 생성시 클레임으로 담은 username이 given 절에서 만든 username과 같은지 검증한다.
        assertThat(username).isEqualTo(testUser.getUsername()); // username으로 변경
    }

    /**
     * 유효성 검증 메소드 테스트
     * - 만료된 토큰인 경우에 유효성 검증에 실패한다.
     */
    @DisplayName("validToken(): 만료된 토큰인 경우에 유효성 검증에 실패한다.")
    @Test
    void validToken_invalidToken() {
        // given, 만료시간설정, 기준일인 1970년 1월 1일부터 현재 날짜를 기준으로 7일 전으로 설정한다. 즉, 만료된 토큰으로 설정한다.
        String token = JwtFactory.builder()
                .expiration(new Date(new Date().getTime() - Duration.ofDays(7).toMillis()))
                .build()
                .createToken(jwtProperties);

        // when, 위에서 만든 만료된 토큰을 유효성 검증 메소드에 전달한다. 만료된 토큰이므로 false가 반환된다.
        boolean result = tokenProvider.validateToken(token);

        // then, 유효성 검증 결과가 false인지 검증한다.
        assertThat(result).isFalse();
    }

    /**
     * 유효성 검증 메소드 테스트
     * - 유효한 토큰인 경우에 유효성 검증에 성공한다.
     */
    @DisplayName("validToken(): 유효한 토큰인 경우에 유효성 검증에 성공한다.")
    @Test
    void validToken_validToken() {
        // given, 유효한 토큰 생성, 기본값으로 토큰을 생성한다.
        // 기본값은 현재 시간을 기준으로 14일 후로 만료시간을 설정한다.
        String token = JwtFactory.withDefaultValues()
                .createToken(jwtProperties);

        // when, 유효한 토큰을 유효성 검증 메소드에 전달한다. 유효한 토큰이므로 true가 반환된다.
        boolean result = tokenProvider.validateToken(token);

        // then, 유효성 검증 결과가 true인지 검증한다.
        assertThat(result).isTrue();
    }

    /**
     * 토큰을 전달받아 인증 정보를 담은 Authentication 객체를 반환하는 메소드 테스트
     */
//    @DisplayName("getAuthentication(): 토큰 기반으로 인증정보를 가져올 수 있다.")
//    @Test
//    void getAuthentication() {
//        // given
//        String userEmail = "test@test.com";
//        // 토큰 생성, 주제로 사용할 이메일을 전달해 토큰을 생성한다.
//        String token = JwtFactory.builder()
//                .subject(userEmail)
//                .build()
//                .createToken(jwtProperties);
//
//        // when, 토큰 제공자의 getAuthentication 메소드에 토큰을 전달해 인증 정보를 가져온다.
//        Authentication authentication = tokenProvider.getAuthentication(token);
//        log.info("authentication: " + authentication);
//        log.info("authentication.getPrincipal() : " + authentication.getPrincipal().getClass().getName());
//
//        // then, 반환받은 인증 정보에서 주제로 사용한 이메일이 위에서 설정한 이메일과 같은지 검증한다.
//        assertThat(((UserDetails) authentication.getPrincipal()).getUsername()).isEqualTo(userEmail);
//    }

    /**
     * 토큰을 전달받아 회원 ID를 반환하는 메소드 테스트
     */
    @DisplayName("getUserId(): 토큰으로 Member ID를 가져올 수 있다.")
    @Test
    void getUserId() {
        // given
        Long memberId = 1L;   // 회원 ID
        // 토큰 생성, id로 사용할 userId로 클레임을 만들어서 토큰을 생성한다.
        String token = JwtFactory.builder()
                .claims(Map.of("id", memberId))   // 회원 ID를 토큰에 담아서 토큰을 생성한다.
                .build()
                .createToken(jwtProperties);    // 토큰 생성시 사용할 jwtProperties를 전달한다. 이때 properties에는 시크릿 키가 포함되어 있다. 시크릿 키를 사용하면 토큰을 더 안전하게 만들 수 있다. 즉, 시크릿 키를 알지 못하면 토큰을 변조할 수 없다. 토큰을 한 단계 더 안전하게 만들기 위해 시크릿 키를 사용한다.

        // when, 토큰 제공자의 getUserId 메소드에 토큰을 전달해 유저 ID를 가져온다.
        Long memberIdByToken = tokenProvider.getUserId(token);

        // then, 반환받은 유저 ID가 위에서 설정한 userId와 같은지 검증한다.
        assertThat(memberIdByToken).isEqualTo(memberId);
    }
}
