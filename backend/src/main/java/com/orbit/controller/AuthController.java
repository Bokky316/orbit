package com.orbit.controller;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.entity.member.Member;
import com.orbit.service.MemberService;
import com.orbit.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 사용자의 정보를 조회하는 컨트롤러
 * - 사용자 정보 조회 API(메소드)를 제공
 * - 이 컨트롤러로 오기 전에 이미 필터에서 사용자가 제공한 토큰에서 사용자 정보를 추출해서 인증 객체를 만들고
 *   그것을 SecurityContextHolder에 저장했다. getUserInfo 에서는 이전 단계에서
 *   SecurityContextHolder에 저장된 인증 객체를 매개변수로 받아서 사용자 정보를 조회한다.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final RefreshTokenService refreshTokenService;
    private final MemberService memberService;
    private final TokenProvider tokenProvider;

    /**
     * 사용자 정보 조회
     * @param authentication 인증 객체
     * @return 사용자 정보
     */
    @GetMapping("/userInfo") // api/auth/userInfo
    public ResponseEntity<Map<String, Object>> getUserInfo(Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        // 인증 객체가 없는 경우 처리
        if (authentication == null || !authentication.isAuthenticated()) {
            response.put("status", "error");
            response.put("message", "인증되지 않은 사용자입니다.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 인증 객체에서 사용자 username 추출
        String username = authentication.getName(); // email -> username으로 변경

        // 사용자 정보 가져오기
        Member member = memberService.findByUsername(username); // email -> username으로 변경
        if (member == null) {
            response.put("status", "error");
            response.put("message", "사용자를 찾을 수 없습니다.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        // 사용자 정보 응답
        response.put("status", "success");
        response.put("data", member);
        return ResponseEntity.ok(response);
    }

    /*
    getUserInfo() 메소드의 응답 예시

    {
      "status": "success",
      "data": {
        "id": 1,
        "name": "John Doe",
        "username": "johndoe", // username 추가
        "email": "john.doe@example.com",
        "phone": "010-1234-5678",
        "address": "Seoul, Korea"
      }
    }
     */

    /**
     * [개선] 로그인 실패 시 응답
     * @return 에러 메시지
     */
    @GetMapping("/login/error")
    public ResponseEntity<Map<String, String>> loginError() {
        Map<String, String> response = new HashMap<>();
        response.put("error", "로그인에 실패했습니다.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
}

