package com.orbit.security;

import com.orbit.entity.Member;
import com.orbit.repository.MemberRepository;
import com.orbit.security.dto.MemberSecurityDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("여기는 CustomUserDetailsService loadUserByUsername username: {}", username);

        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        if (member.isSocial()) {
            throw new UsernameNotFoundException("소셜 로그인 사용자는 일반 로그인을 할수 없습니다. 회원가입을 하세요.");
        }

        return new MemberSecurityDto(
                member.getId(),
                member.getEmail(),
                member.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + member.getRole().toString())),
                member.getName(),
                false,
                null,
                null
        );
    }
}