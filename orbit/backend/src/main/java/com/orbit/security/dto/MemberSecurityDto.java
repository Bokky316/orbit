package com.orbit.security.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
@Setter
@ToString
public class MemberSecurityDto extends User implements OAuth2User {

    private Long id; // 사용자 ID 추가[수정]
    private String email;
    private boolean social;
    private String provider;
    private String name;
    private Map<String, Object> attributes; // 소셜 사용자 정보

    public MemberSecurityDto(Long id,   // 사용자 ID 추가[수정]
                             String username,
                             String password,
                             Collection<? extends GrantedAuthority> authorities,
                             String name,
                             boolean social,
                             String provider,
                             Map<String, Object> attributes) {
        super(username, password, authorities);
        this.email = username;
        this.id = id;   // 사용자 ID 추가[수정]
        this.name = name;
        this.social = social;
        this.provider = provider;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return email;
    }

    /**
     * 사용자의 실제 이름 반환
     * @return 사용자 이름
     */
    public String getRealName() {
        return name;
    }
}
