package com.orbit.repository;

import com.orbit.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoredRefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    /**
     * 리프레시 토큰 문자열로 RefreshToken 엔티티를 찾습니다.
     * @param token 리프레시 토큰 문자열
     * @return 해당 토큰에 대한 RefreshToken 엔티티 (Optional)
     */
    Optional<RefreshToken> findByRefreshToken(String token);

    /**
     * 회원 ID로 RefreshToken 엔티티를 찾습니다.
     * @param memberId 회원 ID
     * @return 해당 회원의 RefreshToken 엔티티 (Optional)
     */
    Optional<RefreshToken> findByMemberId(Long memberId);

    /**
     * 회원 ID로 RefreshToken 엔티티를 삭제합니다.
     * @param memberId 회원 ID
     */
    void deleteByMemberId(Long memberId);
}
