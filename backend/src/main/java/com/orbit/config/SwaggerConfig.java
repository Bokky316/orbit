package com.orbit.config;

import java.util.List;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityScheme.In;
import io.swagger.v3.oas.models.security.SecurityScheme.Type;
import io.swagger.v3.oas.models.servers.Server;

/**
 * OpenAPI 설정 클래스(스웨거 설정)
 * 테스트 URL : http://localhost:8080/swagger-ui/index.html
 * OpenAPIConfig 클래스는 Spring Boot 애플리케이션에서 OpenAPI 및 Swagger 설정을
 * 담당하는 구성 클래스입니다. 이 클래스는 Springdoc OpenAPI 라이브러리를 사용하여
 * API 문서화 작업을 수행합니다. OpenAPI는 REST API의 명세를 작성하는 데 사용되며,
 * Swagger UI와 같은 도구를 통해 API 명세를 웹 인터페이스로 쉽게 확인할 수 있습니다.
 */
@Configuration
public class SwaggerConfig {

    /**
     * OpenAPI: Springdoc OpenAPI 라이브러리의 클래스로, OpenAPI 명세를 정의합니다.
     * 웹브라우저에서 스웨거 초기 화면을 확인할 수 있습니다.
     * - http://localhost:8080/swagger-ui/index.html
     * @return OpenAPI 명세를 포함한 OpenAPI 객체
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("My API")    // API 명세의 제목
                        .description("My application API documentation")    // API 명세의 설명
                        .version("v1.0")    // API 명세의 버전
                        .license(new License().name("Apache 2.0").url("http://springdoc.org")))   // API 명세의 라이선스 정보
                .servers(List.of(new Server().url("http://localhost:8080")))    // API를 호스팅하는 서버를 정의합니다.(이 경우 로컬 서버)
                .externalDocs(new ExternalDocumentation()
                        .description("My API Wiki Documentation")   // 외부 문서 설명
                        .url("https://myapi.wiki.github.org/docs"))    // 외부 문서 URL
                // Security Requirement 추가, "Authorization" Security Scheme을 사용하도록 설정,
                // 이 설정을 통해서 API 호출 시 JWT 토큰을 전달해야 함을 나타냅니다.
                .addSecurityItem(new SecurityRequirement().addList("Authorization"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("Authorization", // Security Scheme 추가
                                new SecurityScheme()    // Security Scheme 객체 생성
                                        .name("Authorization")  // Security Scheme의 이름을 "Authorization"으로 지정
                                        .type(Type.APIKEY)  // Security Scheme의 타입을 APIKEY로 지정
                                        .in(In.HEADER)  // Security Scheme의 위치를 HEADER로 지정
                                        .scheme("bearer")   // Security Scheme의 스키마를 "bearer"로 지정
                                        .bearerFormat("JWT")));   // Security Scheme의 bearerFormat
    }

    /**
     * GroupedOpenApi: Springdoc OpenAPI 라이브러리의 클래스로, API 그룹을 정의합니다.
     * 여러 API를 그룹으로 묶어 API 문서를 생성할 수 있도록 하는 클래스입니다.
     * 이는 특정 경로에 해당하는 API들을 그룹화하여 관리할 수 있도록 해줍니다.
     *
     * @return GroupedOpenApi 객체
     */
    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public-api")    // group("public-api"): 그룹의 이름을 "public-api"로 지정합니다. Swagger UI에서 이 이름으로 그룹이 표시됩니다.
                .pathsToMatch("/api/**")    // pathsToMatch("/api/**"): "/api/"로 시작하는 경로에 해당하는 API를 그룹화합니다.
                .build();
    }
}
