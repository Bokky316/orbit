package com.orbit.repository;

//import com.orbit.entity.RefreshToken;
//import org.springframework.data.jpa.repository.JpaRepository;
//
//import java.util.Optional;
//
//public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
//
//    /**
//     * RefreshToken 문자열로 검색
//     * @param refreshToken 리프레시 토큰
//     * @return RefreshToken Optional 객체
//     */
//    Optional<RefreshToken> findByRefreshToken(String refreshToken);
//
//    /**
//     * 이메일을 기반으로 리프레시 토큰 검색
//     * @param email 사용자 이메일
//     * @return Optional<RefreshToken>
//     */
//    Optional<RefreshToken> findByEmail(String email); // 이메일 기반으로 RefreshToken 검색
//
//    /**
//     * 이메일을 기반으로 리프레시 토큰 삭제
//     * @param email 사용자 이메일
//     */
//    void deleteByEmail(String email);
//}
//
