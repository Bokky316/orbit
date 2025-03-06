package com.orbit.security;

import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
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
 * Spring Security의 UserDetailsService 구현체
 * 사용자 인증 시 사용자 정보를 로드하는 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final MemberRepository memberRepository;

    /**
     * 사용자 이름(이메일)을 기반으로 사용자 정보를 로드합니다.
     *
     * @param username 사용자 이름(이메일)
     * @return UserDetails 객체
     * @throws UsernameNotFoundException 사용자를 찾을 수 없는 경우 예외 발생
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("CustomUserDetailsService: loadUserByUsername called with username: {}", username);

        // 데이터베이스에서 사용자 정보 조회
        Member member = memberRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다. 이메일: " + username));

        // Member 엔티티를 기반으로 MemberSecurityDto 생성 및 반환
        return new MemberSecurityDto(
                member.getId(),
                member.getEmail(),
                member.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + member.getRole().name())),
                member.getUsername(),
                member.getCompanyName(),
                member.getContactNumber(),
                member.getAddress()
        );
    }
}
