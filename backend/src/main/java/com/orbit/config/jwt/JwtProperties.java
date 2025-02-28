package com.orbit.config.jwt;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 설정 정보
 * - application.properties 파일에 정의된 jwt.issuer, jwt.secretKey 라는 키값으로 설정해놓은 value 값을 읽어온다.
 *
 */
@Setter
@Getter
@Component  // 스프링 빈으로 등록
@ConfigurationProperties("jwt") // application.properties 파일에 정의된 jwt.issuer, jwt.secretKey 값을 읽어온다.
public class JwtProperties {

    private String issuer;  // application.properties 파일에 정의된 jwt.issuer 값을 읽어온다.
    private String secretKey;   // application.properties 파일에 정의된 jwt.secret_key 값을 읽어온다.(언더스코어 형태로 -> camelCase 형태로 변경)
}

