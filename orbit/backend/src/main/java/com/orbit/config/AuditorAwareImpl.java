package com.orbit.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = "";
        if(authentication != null){
            // 현재 로그인한 사용자의 아이디를 가져옴, 이걸 통해 누가 생성했는지, 수정했는지 알 수 있음. 즉 등록자, 수정자로 넣어줌
            userId = authentication.getName();
        }
        return Optional.of(userId);
    }
}
