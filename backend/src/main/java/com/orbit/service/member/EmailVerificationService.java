package com.orbit.service.member;

import com.orbit.entity.member.VerificationCode;
import com.orbit.repository.member.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

/**
 * 이메일 인증 관련 기능을 제공하는 서비스 클래스
 * - 인증 코드 생성 및 발송
 * - 인증 코드 검증
 * - 이메일 인증 상태 관리
 * - 만료된 인증 코드 정리
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final VerificationCodeRepository verificationCodeRepository;
    private final JavaMailSender emailSender;

    // 인증 코드 길이
    private static final int CODE_LENGTH = 6;

    // 인증 코드 유효 시간 (분)
    private static final int EXPIRATION_MINUTES = 3;

    // 이메일 인증 여부를 저장하는 캐시 (멀티스레드 환경에서도 안전한 ConcurrentHashMap 사용)
    private final Map<String, Boolean> emailVerificationCache = new ConcurrentHashMap<>();

    /**
     * 인증 코드 생성 및 발송
     * @param email 인증 코드를 받을 이메일 주소
     * @return 생성된 인증 코드
     */
    @Transactional
    public String sendVerificationCode(String email) {
        // 이미 존재하는 인증 코드가 있으면 삭제
        VerificationCode existingCode = verificationCodeRepository.findByEmail(email);
        if (existingCode != null) {
            verificationCodeRepository.delete(existingCode);
        }

        // 새로운 인증 코드 생성
        String code = generateRandomCode(CODE_LENGTH);

        // 인증 코드 저장
        VerificationCode verificationCode = new VerificationCode();
        verificationCode.setEmail(email);
        verificationCode.setCode(code);
        verificationCode.setExpirationTime(LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES));
        verificationCodeRepository.save(verificationCode);

        // 이메일 발송
        sendEmail(email, "회원가입 이메일 인증 코드",
                "안녕하세요. 회원가입을 위한 인증 코드입니다.\n\n" +
                        "인증 코드: " + code + "\n\n" +
                        "인증 코드는 " + EXPIRATION_MINUTES + "분 동안 유효합니다.\n" +
                        "이 요청을 하지 않으셨다면 이 이메일을 무시해 주세요.");

        return code;
    }

    /**
     * 인증 코드 검증
     * @param email 이메일 주소
     * @param code 사용자가 입력한 인증 코드
     * @return 인증 성공 여부
     */
    @Transactional
    public boolean verifyCode(String email, String code) {
        VerificationCode verificationCode = verificationCodeRepository.findByEmail(email);

        if (verificationCode == null) {
            return false;
        }

        // 만료 여부 확인
        if (verificationCode.isExpired()) {
            verificationCodeRepository.delete(verificationCode);
            return false;
        }

        // 코드 일치 여부 확인
        if (verificationCode.getCode().equals(code)) {
            // 인증 성공 시 캐시에 저장
            setVerified(email);
            // 사용한 코드는 삭제
            verificationCodeRepository.delete(verificationCode);
            return true;
        }

        return false;
    }

    /**
     * 이메일 인증 상태 확인
     * @param email 확인할 이메일 주소
     * @return 인증된 경우 true, 그렇지 않으면 false 반환
     */
    public boolean isVerified(String email) {
        return emailVerificationCache.getOrDefault(email, false);
    }

    /**
     * 회원가입 완료 후 인증 정보 삭제
     * @param email 인증 정보 삭제할 이메일 주소
     */
    public void removeVerified(String email) {
        emailVerificationCache.remove(email);
    }

    /**
     * 랜덤 인증 코드 생성
     * @param length 생성할 코드의 길이
     * @return 생성된 랜덤 코드
     */
    private String generateRandomCode(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder codeBuilder = new StringBuilder();

        for (int i = 0; i < length; i++) {
            codeBuilder.append(random.nextInt(10)); // 0~9 사이의 숫자
        }

        return codeBuilder.toString();
    }

    /**
     * 이메일 발송
     * @param to 수신자 이메일 주소
     * @param subject 제목
     * @param text 내용
     */
    private void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        emailSender.send(message);
    }

    /**
     * 만료된 인증 코드 정리 (스케줄링 작업)
     * 매일 자정에 실행
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        verificationCodeRepository.deleteByExpirationTimeBefore(now);
    }

    /**
     * 이메일 인증 상태 저장
     * @param email 인증이 완료된 이메일 주소
     */
    public void setVerified(String email) {
        emailVerificationCache.put(email, true);
    }
}