package com.orbit.service.member;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * 이메일 인증 상태를 관리하는 서비스 클래스
 * - 사용자가 이메일 인증을 완료하면 해당 이메일을 인증된 상태로 저장하고,
 *   회원가입이 완료되면 인증 정보를 삭제하는 역할을 수행.
 * - 이메일 인증 여부를 빠르게 확인하기 위해 데이터베이스가 아닌 메모리 캐시(ConcurrentHashMap)를 사용하여 관리.
 * - 인증 상태를 관리하여 중복 인증을 방지하고, 인증된 이메일만 회원가입을 진행할 수 있도록 제어.
 */
@Service
public class EmailVerificationService {

    // 이메일 인증 여부를 저장하는 캐시 (멀티스레드 환경에서도 안전한 ConcurrentHashMap 사용)
    private final Map<String, Boolean> emailVerificationCache = new ConcurrentHashMap<>();

    /**
     * 이메일 인증 상태 저장
     * - 특정 이메일을 인증된 상태로 변경
     * @param email 인증이 완료된 이메일 주소
     */
    public void setVerified(String email) {
        emailVerificationCache.put(email, true);
    }

    /**
     * 이메일 인증 상태 확인
     * - 특정 이메일이 인증되었는지 여부를 확인
     * @param email 확인할 이메일 주소
     * @return 인증된 경우 true, 그렇지 않으면 false 반환
     */
    public boolean isVerified(String email) {
        return emailVerificationCache.getOrDefault(email, false);
    }

    /**
     * 회원가입 완료 후 인증 정보 삭제
     * - 인증이 완료된 이메일 정보를 캐시에서 제거하여 재사용 방지
     * @param email 인증 정보 삭제할 이메일 주소
     */
    public void removeVerified(String email) {
        emailVerificationCache.remove(email);
    }
}
