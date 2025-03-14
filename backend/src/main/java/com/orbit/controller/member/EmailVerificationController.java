package com.orbit.controller.member;

import com.orbit.service.member.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 이메일 인증 관련 API를 제공하는 컨트롤러
 */
@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    /**
     * 이메일 인증 코드 발송 API
     * @param requestMap 이메일 정보가 포함된 요청 맵
     * @return 성공/실패 메시지
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@RequestBody Map<String, String> requestMap) {
        Map<String, Object> response = new HashMap<>();
        String email = requestMap.get("email");

        if (email == null || email.isBlank()) {
            response.put("error", "이메일이 제공되지 않았습니다");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            emailVerificationService.sendVerificationCode(email);
            response.put("message", "인증 코드가 이메일로 전송되었습니다");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "인증 코드 전송에 실패했습니다");
            response.put("details", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 이메일 인증 코드 확인 API
     * @param requestMap 이메일과 인증 코드가 포함된 요청 맵
     * @return 성공/실패 메시지
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyCode(@RequestBody Map<String, String> requestMap) {
        Map<String, Object> response = new HashMap<>();
        String email = requestMap.get("email");
        String code = requestMap.get("code");

        if (email == null || email.isBlank() || code == null || code.isBlank()) {
            response.put("error", "이메일 또는 인증 코드가 제공되지 않았습니다");
            return ResponseEntity.badRequest().body(response);
        }

        boolean isVerified = emailVerificationService.verifyCode(email, code);

        if (isVerified) {
            response.put("message", "이메일 인증이 완료되었습니다");
            return ResponseEntity.ok(response);
        } else {
            response.put("error", "인증 코드가 유효하지 않거나 만료되었습니다");
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * 이메일 인증 상태 확인 API
     * @param email 확인할 이메일 주소
     * @return 인증 상태
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> checkVerificationStatus(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();

        if (email == null || email.isBlank()) {
            response.put("error", "이메일이 제공되지 않았습니다");
            return ResponseEntity.badRequest().body(response);
        }

        boolean isVerified = emailVerificationService.isVerified(email);
        response.put("verified", isVerified);

        return ResponseEntity.ok(response);
    }
}