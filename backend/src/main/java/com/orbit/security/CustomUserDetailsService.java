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

        // Member 엔티티를 기반으로 MemberSecurityDto 생성 및 반환
        return createMemberSecurityDto(member);
    }

    /**
     * Member 엔티티를 기반으로 MemberSecurityDto 생성
     *
     * @param member Member 엔티티 객체
     * @return MemberSecurityDto 객체
     */
    private MemberSecurityDto createMemberSecurityDto(Member member) {
        return new MemberSecurityDto(
                member.getId(), // 사용자 ID
                member.getEmail(), // 이메일
                member.getPassword(), // 비밀번호 (암호화된 상태)
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + member.getRole().name())), // 권한 정보
                member.getUsername(), // 사용자명 (username)
                member.getName(), // 이름
                member.getCompanyName(), // 회사명
                member.getContactNumber(), // 연락처
                member.getPostalCode(), // 우편번호
                member.getRoadAddress(), // 도로명 주소
                member.getDetailAddress() // 상세 주소
        );
    }
}
