package com.orbit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing  // JPA Auditing 활성화
public class AuditConfig {

    /**
     * 현재 로그인한 사용자의 아이디를 가져옴, 이걸 통해 누가 생성했는지, 수정했는지 알 수 있음. 즉 등록자, 수정자로 넣어줌
     * 위 기능을 갖고 있는 AuditorAwareImpl 객체를 빈으로 등록
     * @return
     */
    @Bean
    public AuditorAware<String> auditorProvider(){
        return new AuditorAwareImpl();
    }
}
