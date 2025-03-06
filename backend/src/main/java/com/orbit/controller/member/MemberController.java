package com.orbit.controller.member;

import com.orbit.config.jwt.TokenProvider;
import com.orbit.dto.member.LoginFormDto;
import com.orbit.dto.member.MemberFormDto;
import com.orbit.dto.member.MemberUpdateDto;
import com.orbit.entity.member.Member;
import com.orbit.service.member.MemberService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 회원 관련 API를 제공하는 컨트롤러
 */
@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final TokenProvider tokenProvider;

    /**
     * 회원가입 API
     * @param memberFormDto 회원가입 폼 데이터
     * @return 성공 메시지
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerMember(@Valid @RequestBody MemberFormDto memberFormDto) {
        try {
            if (memberFormDto.getConfirmPassword() == null || !memberFormDto.getPassword().equals(memberFormDto.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호 확인이 일치하지 않습니다.");
            }
            memberService.registerMember(memberFormDto);
            return ResponseEntity.ok("회원가입이 완료되었습니다.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * ID로 회원 정보 조회 API
     * @param id 회원 ID
     * @return 회원 정보
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMemberById(@PathVariable("id") Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Member member = memberService.findById(id);
            response.put("status", "success");
            response.put("data", member);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * 사용자 정보 수정 API
     * @param id 회원 ID
     * @param updateDto 수정할 회원 정보
     * @return 성공 메시지
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMember(
            @PathVariable("id") Long id, @Valid @RequestBody MemberUpdateDto updateDto) {
        Map<String, Object> response = new HashMap<>();
        try {
            memberService.updateMember(id, updateDto);
            response.put("status", "success");
            response.put("message", "회원 정보가 수정되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    /**
     * 이메일 중복 체크 API
     * @param email 확인할 이메일 주소
     * @return 중복 여부
     */
    @GetMapping("/checkEmail")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestParam("email") String email) {
        Map<String, Object> response = new HashMap<>();
        boolean isDuplicate = memberService.isEmailDuplicate(email);
        if (isDuplicate) {
            response.put("status", "duplicate");
            response.put("message", "이미 가입된 이메일입니다.");
        } else {
            response.put("status", "available");
            response.put("message", "사용 가능한 이메일입니다.");
        }
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 API
     * @param loginForm 로그인 폼 데이터
     * @return 성공 메시지 및 JWT 토큰
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> loginMember(
            @RequestBody LoginFormDto loginForm, HttpServletResponse response) {
        Map<String, Object> responseMap = new HashMap<>();

        if (memberService.login(loginForm)) {
            Member member = memberService.findByUsername(loginForm.getUsername());

            // JWT 토큰 생성
            String token = tokenProvider.generateToken(
                    member.getUsername(), member.getAuthorities(), Duration.ofMinutes(30));

            // Refresh Token 생성
            String refreshToken = tokenProvider.generateRefreshToken(member.getUsername(), Duration.ofDays(7));

            // 쿠키에 JWT 토큰 저장
            Cookie jwtCookie = new Cookie("jwtToken", token);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setPath("/");
            response.addCookie(jwtCookie);

            // 쿠키에 Refresh Token 저장
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setHttpOnly(true);
            refreshCookie.setPath("/refresh");
            response.addCookie(refreshCookie);

            responseMap.put("status", "success");
            responseMap.put("message", "로그인 성공");
            responseMap.put("id", member.getId());
            responseMap.put("username", member.getUsername());
            responseMap.put("name", member.getName());
            responseMap.put("roles", member.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList())); // 역할을 문자열 리스트로 변환
            responseMap.put("token", token);
            return ResponseEntity.ok(responseMap);
        } else {
            responseMap.put("status", "failed");
            responseMap.put("message", "로그인 실패");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(responseMap);
        }
    }

    /**
     * 이름으로 회원 검색 API
     * @param query 검색어
     * @return 검색 결과 리스트
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMembers(@RequestParam("query") String query) {
        Map<String, Object> response = new HashMap<>();
        List<Member> members = memberService.searchMembersByName(query);
        response.put("status", "success");
        response.put("data", members);
        return ResponseEntity.ok(response);
    }

    /**
     * 회원 탈퇴 API
     * @param id 탈퇴할 회원의 ID
     * @return 성공 메시지
     */
    @PostMapping("/deactivate/{id}")
    public ResponseEntity<String> deactivateMember(@PathVariable Long id) {
        try {
            memberService.deactivateMember(id);
            return ResponseEntity.ok("회원 탈퇴 완료");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
