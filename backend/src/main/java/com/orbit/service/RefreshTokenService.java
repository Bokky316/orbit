package com.orbit.service;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.entity.member.Member;
import com.orbit.entity.RefreshToken;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.StoredRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    @Transactional
    public String renewAccessToken(String refreshToken) {
        // 토큰 유효성 검사
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        // 저장된 리프레시 토큰 조회
        RefreshToken storedRefreshToken = storedRefreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("리프레시 토큰을 찾을 수 없습니다."));

        // 토큰 만료 확인
        if (storedRefreshToken.isExpired()) {
            throw new IllegalArgumentException("만료된 리프레시 토큰입니다.");
        }

        // 회원 조회
        Member member = memberRepository.findById(storedRefreshToken.getMemberId())
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));

        // 새로운 액세스 토큰 생성
        return tokenProvider.generateToken(
                member.getUsername(),
                member.getAuthorities(),
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

        // DB에서 기존 리프레시 토큰 조회
        RefreshToken existingToken = storedRefreshTokenRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("데이터베이스에서 리프레시 토큰을 찾을 수 없습니다."));

        // 토큰 만료 확인
        if (existingToken.isExpired()) {
            throw new IllegalArgumentException("만료된 리프레시 토큰입니다.");
        }

        // 토큰 만료 3일 전부터 갱신
        if (existingToken.getExpiryDate().minusDays(3).isBefore(LocalDateTime.now())) {
            String username = tokenProvider.getUsernameFromToken(refreshToken);
            String newRefreshToken = tokenProvider.generateRefreshToken(username, Duration.ofDays(14));
            LocalDateTime newExpiryDate = LocalDateTime.now().plusDays(14);

            existingToken.update(newRefreshToken, newExpiryDate);
            return storedRefreshTokenRepository.save(existingToken);
        }

        return existingToken;
    }

    /**
     * 리프레시 토큰 저장 또는 업데이트
     * @param username 사용자 username
     * @param refreshToken 리프레시 토큰
     * @param memberId 회원 ID
     */
    @Transactional
    public void saveOrUpdateRefreshToken(String username, String refreshToken, Long memberId) {
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(14); // 14일 후 만료

        RefreshToken tokenEntity = storedRefreshTokenRepository.findByMemberId(memberId)
                .map(token -> token.update(refreshToken, expiryDate))
                .orElse(RefreshToken.builder()
                        .memberId(memberId)
                        .refreshToken(refreshToken)
                        .expiryDate(expiryDate)
                        .build());

        storedRefreshTokenRepository.save(tokenEntity);
    }

    /**
     * 회원 ID로 리프레시 토큰 삭제
     * @param memberId 회원 ID
     */
    @Transactional
    public void deleteRefreshTokenByMemberId(Long memberId) {
        storedRefreshTokenRepository.deleteByMemberId(memberId);
    }
}
