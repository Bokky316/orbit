package com.orbit.service;

import com.orbit.dto.LoginFormDto;
import com.orbit.dto.MemberFormDto;
import com.orbit.entity.Member;
import com.orbit.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 관리 서비스
 * 회원 가입, 로그인, 회원 조회 등의 기능을 제공합니다.
 */
@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 회원가입 처리
     * @param memberFormDto 클라이언트에서 전달받은 회원가입 데이터
     * @throws IllegalStateException 이미 존재하는 username으로 가입 시도할 경우
     */
    @Transactional
    public void registerMember(MemberFormDto memberFormDto) {
        // username 중복 체크
        if (memberRepository.findByUsername(memberFormDto.getUsername()).isPresent()) {
            throw new IllegalStateException("이미 존재하는 username입니다.");
        }

        // MemberFormDto를 Member 엔티티로 변환
        Member member = Member.createMember(memberFormDto, passwordEncoder);

        // 데이터 저장
        memberRepository.save(member);
    }

    /**
     * username 중복 체크
     * @param username 클라이언트에서 입력받은 username
     * @return true(중복) or false(사용 가능)
     */
    public boolean isUsernameDuplicate(String username) {
        return memberRepository.findByUsername(username).isPresent();
    }

    /**
     * 로그인 처리
     * @param loginForm 로그인 폼 데이터 (username, 비밀번호)
     * @return 로그인 성공 여부 (true: 성공, false: 실패)
     */
    public boolean login(LoginFormDto loginForm) {
        // username으로 회원 검색 후 비밀번호 일치 여부 확인
        return memberRepository.findByUsername(loginForm.getUsername())
                .map(member -> passwordEncoder.matches(loginForm.getPassword(), member.getPassword()))
                .orElse(false);
    }

    /**
     * 회원 ID로 회원 조회
     * @param memberId 조회할 회원의 ID
     * @return 조회된 회원 엔티티
     * @throws IllegalArgumentException 존재하지 않는 회원 ID로 조회 시
     */
    public Member findById(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }

    /**
     * username으로 회원 조회
     * @param username 조회할 회원의 username
     * @return 조회된 회원 엔티티
     * @throws IllegalArgumentException 존재하지 않는 username으로 조회 시
     */
    public Member findByUsername(String username) {
        return memberRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));
    }
}
