package com.orbit.service;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.entity.member.Member;
import com.orbit.entity.RefreshToken;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.StoredRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

/**
 * 리프레시 토큰 서비스 클래스
 * - 리프레시 토큰 관련 비즈니스 로직 처리
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final TokenProvider tokenProvider;
    private final StoredRefreshTokenRepository storedRefreshTokenRepository;
    private final MemberRepository memberRepository;

    /**
     * 리프레시 토큰을 사용하여 새로운 액세스 토큰 발급
     * @param refreshToken 기존 리프레시 토큰
     * @return 새로운 액세스 토큰
     */
    public String renewAccessToken(String refreshToken) {
        // 토큰 유효성 검사
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 저장된 리프레시 토큰 조회
        RefreshToken storedRefreshToken = storedRefreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("리프레시 토큰을 찾을 수 없습니다."));

        // 회원 조회
        Member member = memberRepository.findById(storedRefreshToken.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 새로운 액세스 토큰 생성
        return tokenProvider.generateToken(
                member.getEmail(),
                Duration.ofHours(1)
        );
    }

    /**
     * 리프레시 토큰 검증 및 갱신
     * @param refreshToken 기존 리프레시 토큰
     * @return 검증된 리프레시 토큰 또는 새로 발급된 리프레시 토큰
     */
    @Transactional
    public RefreshToken validateAndRefreshToken(String refreshToken) {
        // 토큰 유효성 검사
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 토큰에서 이메일 추출
        String email = tokenProvider.getEmailFromToken(refreshToken);

        // DB에서 기존 리프레시 토큰 조회
        RefreshToken existingToken = storedRefreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("데이터베이스에서 리프레시 토큰을 찾을 수 없습니다."));

        // 토큰 재발급 여부 확인
        if (!tokenProvider.validateToken(refreshToken)) {
            // 새 리프레시 토큰 생성
            String newRefreshToken = tokenProvider.generateRefreshToken(email, Duration.ofDays(14));

            // 새 토큰으로 업데이트
            RefreshToken updatedToken = RefreshToken.builder()
                    .memberId(existingToken.getMemberId())
                    .refreshToken(newRefreshToken)
                    .build();

            // DB에 새 토큰 저장
            return storedRefreshTokenRepository.save(updatedToken);
        }

        return existingToken;
    }

    /**
     * 리프레시 토큰 저장 또는 업데이트
     * @param email 사용자 이메일
     * @param refreshToken 리프레시 토큰
     */
    @Transactional
    public void saveOrUpdateRefreshToken(String email, String refreshToken) {
        // 회원 조회
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 새 리프레시 토큰 생성
        RefreshToken newRefreshToken = RefreshToken.builder()
                .memberId(member.getId())
                .refreshToken(refreshToken)
                .build();

        // 토큰 저장
        storedRefreshTokenRepository.save(newRefreshToken);
    }
}