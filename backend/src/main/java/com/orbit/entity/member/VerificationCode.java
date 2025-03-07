package com.orbit.entity.member;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 이메일 인증 코드 저장 엔티티
 * - 사용자가 이메일 인증을 요청하면 생성됨
 * - 이메일과 연결된 인증 코드를 저장하고, 만료 시간을 설정하여 일정 시간이 지나면 사용 불가하게 함
 */
@Entity
@Getter @Setter
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 증가 ID
    private Long id;

    @Column(nullable = false, unique = true)    // 이메일은 반드시 존재하며, 중복되지 않아야 함
    private String email;

    @Column(nullable = false)   // 인증 코드 필수 값
    private String code;

    @Column(nullable = false)   // 만료 시간 필수 값
    private LocalDateTime expirationTime;

    /**
     * 인증 코드 만료 여부 확인
     * - 현재 시간이 만료 시간(expirationTime)을 초과했는지 여부를 반환
     * - true이면 만료된 코드이며, 사용 불가 상태
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expirationTime);
    }
}
