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

/**
 * 사용자 정보를 가져오는 역할
 * - UserDetailsService 인터페이스를 구현하여 사용자 정보를 가져오는 역할
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    /**
     * 사용자 정보를 가져오는 역할
     *  - 여기서 반화된 객체는 아직 인증이 완료되지 않았으며 인증은 AuthenticationManager가 수행
     *  - 여기서는 사용자 정보를 가져와서 UserDetails 객체로 만들어서 반환, 나머지는 Spring Security가 처리
     *    즉 인증이 성공하게 되면 UserDetails 객체를 SecurityContextHolder에 저장.
     * @param username
     * @throws UsernameNotFoundException
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        log.info("여기는 CustomUserDetailsService loadUserByUsername username: {}", username);

        Member member = memberRepository.findByEmail(username);

        if (member == null) {
            throw new UsernameNotFoundException("User not found with email: " + username);
        }

        if (member.isSocial()) {
            throw new UsernameNotFoundException("소셜 로그인 사용자는 일반 로그인을 할수 없습니다. 회원가입을 하세요.");
        }

        return new MemberSecurityDto(
                member.getId(), // 사용자 ID 추가
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
