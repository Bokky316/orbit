package com.orbit.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // 👇 모든 도메인 허용 (배포 시 "http://localhost:3000"만 허용 가능)
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.addAllowedOriginPattern("*"); // WebSocket을 위한 추가 설정

        source.registerCorsConfiguration("/**", config);
        source.registerCorsConfiguration("/ws/**", config); // WebSocket 경로 명시적 추가

        return new CorsFilter(source);
    }
}