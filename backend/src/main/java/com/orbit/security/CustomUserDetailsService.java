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
import java.util.Optional;

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
     * 사용자 이름(username)을 기반으로 사용자 정보를 로드합니다.
     *
     * @param username 사용자 이름(username)
     * @return UserDetails 객체 (MemberSecurityDto)
     * @throws UsernameNotFoundException 사용자를 찾을 수 없는 경우 예외 발생
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("CustomUserDetailsService: loadUserByUsername called with username: {}", username);

        // 데이터베이스에서 사용자 정보 조회
        Optional<Member> optionalMember = memberRepository.findByUsername(username);
        Member member = optionalMember.orElseThrow(() -> {
            log.error("사용자를 찾을 수 없습니다. 사용자명: {}", username);
            return new UsernameNotFoundException("사용자를 찾을 수 없습니다. 사용자명: " + username);
        });

        // 계정 활성화 상태 확인
        if (!member.isEnabled()) {
            log.warn("비활성화된 계정으로 로그인 시도: {}", username);
            throw new UsernameNotFoundException("비활성화된 계정입니다. 관리자에게 문의하세요.");
        }

        // Member 엔티티를 기반으로 MemberSecurityDto 생성 및 반환
        return createMemberSecurityDto(member);
    }

    /**
     * Member 엔티티를 기반으로 MemberSecurityDto 생성
     *
     * @param member Member 엔티티 객체
     * @return MemberSecurityDto 객체
     */
    // CustomUserDetailsService.java의 createMemberSecurityDto 메서드 수정
    private MemberSecurityDto createMemberSecurityDto(Member member) {
        Long departmentId = member.getDepartment() != null ? member.getDepartment().getId() : null;

        return new MemberSecurityDto(
                member.getId(),
                member.getEmail(),
                member.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + member.getRole().name())),
                member.getUsername(),
                member.getName(),
                member.getCompanyName(),
                member.getContactNumber(),
                member.getPostalCode(),
                member.getRoadAddress(),
                member.getDetailAddress(),
                departmentId
        );
    }
}
