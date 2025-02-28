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
 * Swagger(OpenAPI) 설정 클래스
 * - Swagger UI: http://localhost:8080/swagger-ui/index.html
 * - API 명세서 URL: http://localhost:8080/v3/api-docs
 */
@Configuration
public class SwaggerConfig {

    /**
     * OpenAPI 설정
     * - API 제목, 설명, 라이선스 정보 설정
     * - 서버 URL 설정
     * - 보안 설정 추가 (JWT Bearer 토큰 사용)
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("My API")   // API 제목
                        .description("My application API documentation")  // API 설명
                        .version("v1.0")   // API 버전
                        .license(new License().name("Apache 2.0").url("http://springdoc.org"))  // 라이선스 정보
                )
                .servers(List.of(new Server().url("http://localhost:8080")))  // API 서버 URL
                .externalDocs(new ExternalDocumentation()
                        .description("My API Wiki Documentation")   // 외부 문서 설명
                        .url("https://myapi.wiki.github.org/docs"))  // 외부 문서 URL
                // Security 설정 추가 (JWT 사용)
                .addSecurityItem(new SecurityRequirement().addList("BearerToken"))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("BearerToken",
                                new SecurityScheme()
                                        .name("BearerToken")   // 보안 스키마 이름
                                        .type(Type.HTTP)  // 타입 설정 (HTTP 기반)
                                        .scheme("bearer")  // Bearer 인증 사용
                                        .bearerFormat("JWT")  // JWT 토큰 형식
                                        .in(In.HEADER)));  // 인증 토큰을 HTTP 헤더에서 읽음
    }

    /**
     * Swagger UI에서 특정 API 경로만 문서화하도록 설정
     * - `/api/**` 경로만 문서화
     */
    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public-api")  // 그룹 이름 (Swagger UI에서 표시됨)
                .pathsToMatch("/api/**")  // `/api/`로 시작하는 경로만 문서화
                .build();
    }
}
