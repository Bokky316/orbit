package com.orbit.repository.member;

import com.orbit.entity.member.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

/**
 * 이메일 인증 코드 저장소 (Repository)
 * - 이메일 인증 코드 관련 데이터베이스 작업을 처리하는 JPA Repository 인터페이스
 * - VerificationCode 엔티티와 연결되며, 기본적인 CRUD 기능 제공
 */
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    /**
     * 이메일을 기반으로 인증 코드 조회
     * - 특정 이메일의 인증 코드를 가져오기 위해 사용
     * - 이메일은 유니크(unique)하므로 단일 레코드 반환
     *
     * @param email 찾을 인증 코드의 이메일 주소
     * @return VerificationCode 인증 코드 엔티티 (없으면 null 반환)
     */
    VerificationCode findByEmail(String email);

    /**
     * 만료 시간이 지난 모든 인증 코드 삭제
     * - 주기적으로 사용되어 데이터베이스의 오래된 인증 코드를 정리
     * - @Modifying 어노테이션은 데이터를 변경하는 쿼리임을 나타냄
     *
     * @param expirationTime 기준 만료 시간
     * @return 삭제된 레코드 수
     */
    @Modifying
    @Query("DELETE FROM VerificationCode vc WHERE vc.expirationTime < :expirationTime")
    int deleteByExpirationTimeBefore(@Param("expirationTime") LocalDateTime expirationTime);

    /**
     * 특정 이메일의 기존 인증 코드 삭제
     * - 새로운 인증 코드를 발급하기 전에 기존 코드를 제거할 때 사용
     *
     * @param email 인증 코드를 삭제할 이메일 주소
     * @return 삭제된 레코드 수
     */
    @Modifying
    @Query("DELETE FROM VerificationCode vc WHERE vc.email = :email")
    int deleteByEmail(@Param("email") String email);
}