package com.orbit.repository.member;


import com.orbit.entity.member.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 이메일 인증 코드 저장소 (Repository)
 * - 이메일 인증 코드 관련 데이터베이스 작업을 처리하는 JPA Repository 인터페이스
 * - VerificationCode 엔티티와 연결되며, 기본적인 CRUD 기능 제공
 */
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    /**
     * 이메일을 기반으로 인증 코드 조회
     * - 특정 이메일의 인증 코드를 가져오기 위해 사용
     * - 이메일은 유니크(unique)하므로 반환값은 Optional (존재할 수도 있고, 없을 수도 있음)
     *
     * @param email 찾을 인증 코드의 이메일 주소
     * @return Optional<VerificationCode> 인증 코드가 있으면 반환, 없으면 비어있는 Optional 반환
     */
    Optional<VerificationCode> findByEmail(String email);
}
