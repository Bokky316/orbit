package com.orbit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import static io.lettuce.core.KillArgs.Builder.maxAge;

/**
 * WebConfig : 환경설정 파일
 * - @configuration : 이 클래스가 spring의 설정 파일임을 명시, 여기에는 하나 이상의 @Bean이 있음.
 *   프로젝트가 구동될 때 이 클래스를 읽어들여 Bean으로 등록
 *
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // application.properties 파일에 설정된 값을 가져온다.
    @Value("${uploadPath}")
    String uploadPath;  // file:///c:/shop/

    /**
     * CORS(Cross-Origin Resource Sharing) 설정
     * - addMapping : CORS를 적용할 URL pattern, 모든 URL에 대해 적용하려면 /** 로 설정
     * - allowedOrigins : CORS를 허용할 origin URL, 여기서는 3000번 포트로 들어오는 요청만 허용
     * - allowedMethods : CORS를 허용할 HTTP 메서드, GET, POST, PUT, DELETE, OPTIONS
     * - allowedHeaders : CORS를 허용할 HTTP 헤더
     * - allowCredentials : 쿠키를 주고 받을 수 있게 설정
     * @param registry
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")    // 모든 헤더를 허용
                .exposedHeaders("Authorization")
                .allowCredentials(true)    // 쿠키를 주고 받을 수 있게 설정, 세션을 사용할 때는 true로 설정, 왜? 세션은 쿠키를 사용하기 때문, 쿠키에는 사용자의 정보가 담겨있음
                .maxAge(3600L);


    }


    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/images/**")   // /images/** 요청이 오면 uploadPath로 매핑
                .addResourceLocations(uploadPath);  // 로컬 컴퓨터에 저장된 파일을 읽어올 root 경로를 설정합니다.

        // 파일 업로드 경로 추가
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);

        registry.addResourceHandler("/static-images/**")
                .addResourceLocations("classpath:/static/images/");  // 정적 리소스

        registry.addResourceHandler("/favicon.ico")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(0);
        // [스웨거] Swagger UI 설정
        // /swagger-ui/**로 시작하는 URL 요청은 서버의 /META-INF/resources/webjars/swagger-ui/ 디렉토리에서 파일을 찾습니다.
        // 이 경로는 Swagger UI의 HTML, CSS, JavaScript 파일들을 포함하고 있습니다.
        // Spring은 이 리소스들을 classpath:/META-INF/resources/webjars/swagger-ui/ 경로에서 찾아 제공하게 됩니다.
        // 이로 인해 사용자가 브라우저에서 Swagger UI에 접근할 수 있게 됩니다.
        // /META-INF/resources/webjars/swagger-ui/ : 어느 라이브러리에 있나? 스웨거 UI 라이브러리에 있음.
        registry.addResourceHandler("/swagger-ui/**")   // 어떤 URL 패턴이 정적 리소스로 처리되어야 하는지를 정의합니다.
                .addResourceLocations("classpath:/META-INF/resources/webjars/swagger-ui/")
                .resourceChain(false); // 주로 디버깅이나 개발 중에 파일 변경 사항을 바로 반영하기 위해 사용됩니다.   쉽게 말해서, 리소스 체인은 정적 파일을 더 빠르고 효율적으로 제공하려는 "비서" 같은 역할을 하고, resourceChain(false)는 그 비서를 쉬게 하고 직접 파일을 제공하는 방식입니다.

        // 모든 URL 요청을 리액트의 index.html로 매핑하기 위한 설정[수정]
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/frontend/public/");


    }

    /**
     * 뷰 컨트롤러 설정[수정]
     * - React의 index.html을 기본 뷰로 설정
     * - /로 요청이 오면 index.html로 포워딩
     * -
     * @param registry
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // React의 index.html을 기본 뷰로 매핑
        registry.addViewController("/{spring:[^\\.]*}")
                .setViewName("forward:/frontend/public/index.html");
    }
}