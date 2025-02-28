package com.orbit.config;

import com.orbit.config.jwt.RefreshTokenCheckFilter;
import com.orbit.config.jwt.TokenAuthenticationFilter;
import com.orbit.config.jwt.TokenProvider;
import com.orbit.security.CustomUserDetailsService;
import com.orbit.security.handler.*;
import com.orbit.security.oauth.CustomOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@Log4j2
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;
    private final TokenAuthenticationFilter tokenAuthenticationFilter;
    private final TokenProvider tokenProvider;
    private final RefreshTokenCheckFilter refreshTokenCheckFilter;
    private final CustomLogoutSuccessHandler customLogoutSuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // 로그인 설정
        http.formLogin(form -> form
                .loginPage("/api/auth/login")
                .loginProcessingUrl("/api/auth/login")
                .successHandler(customAuthenticationSuccessHandler)
                .failureHandler((request, response, exception) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"로그인에 실패했습니다.\"}");
                })
                .permitAll()
        );

        // 로그아웃 설정
        http.logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(customLogoutSuccessHandler)
                .permitAll()
        );

        // CORS 설정
        http.cors(Customizer.withDefaults());

        // URL 접근 권한 설정
        http.authorizeHttpRequests(request -> request
                // WebSocket 관련 설정
                .requestMatchers("/ws/**", "/topic/**").permitAll()
                
                // 인증이 필요없는 공개 API
                .requestMatchers(
                    "/",
                    "/api/auth/**",
                    "/api/members/register",
                    "/api/members/checkEmail"
                ).permitAll()

                // 관리자 전용 API
                .requestMatchers(
                    "/api/admin/**"
                ).hasRole("ADMIN")

                // 정적 리소스 허용
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-ui.html",
                    "/images/**",
                    "/image/**",
                    "/static-images/**",
                    "/css/**",
                    "/img/**",
                    "/favicon.ico",
                    "/error",
                    "/**/*.css",
                    "/**/*.js",
                    "/**/*.png",
                    "/**/*.jpg",
                    "/**/*.jpeg",
                    "/**/*.gif",
                    "/**/*.svg",
                    "/**/*.html",
                    "/ping.js"
                ).permitAll()

                // 그 외 모든 요청은 인증 필요
                .anyRequest().authenticated()
        );

        // 필터 설정
        http.addFilterBefore(tokenAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(refreshTokenCheckFilter, TokenAuthenticationFilter.class);

        // 예외 처리
        http.exceptionHandling(exception -> exception
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
        );

        // CSRF 비활성화
        http.csrf(csrf -> csrf.disable());

        // OAuth2 로그인 설정
        // http.oauth2Login(oauth2 -> oauth2
        //         .loginPage("/api/auth/login/kakao")
        //         .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
        // );

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(customUserDetailsService)
                .passwordEncoder(passwordEncoder())
                .and()
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}