package com.orbit.controller.member;


import com.orbit.config.jwt.TokenProvider;
import com.orbit.dto.LoginFormDto;
import com.orbit.dto.MemberFormDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.VerificationCodeRepository;
import com.orbit.service.MemberService;
import com.orbit.service.RefreshTokenService;
import com.orbit.service.member.EmailVerificationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final TokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final VerificationCodeRepository verificationCodeRepository; // 이메일 인증 확인을 위한 리포지토리 추가
    private final EmailVerificationService emailVerificationService; // 이메일 인증을 관리하는 클래스

    /**
     * 회원가입 처리
     * - 사용자가 입력한 이메일이 인증되었는지 확인 후, 회원가입을 진행한다.
     * - 회원가입이 성공하면 인증 정보를 삭제하여 재사용을 방지한다.
     * @param memberFormDto - 클라이언트에서 전송한 회원가입 데이터
     * @return 회원가입 성공 또는 실패 메시지
     */
    @PostMapping("/register")
    public ResponseEntity<String> registerMember(@Valid @RequestBody MemberFormDto memberFormDto) {
        // 이메일 인증 확인
        if (!emailVerificationService.isVerified(memberFormDto.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("이메일 인증이 필요합니다.");
        }

        try {
            // ✅ 비밀번호 확인 검증 추가
            if (memberFormDto.getConfirmPassword() == null || !memberFormDto.getPassword().equals(memberFormDto.getConfirmPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호가 일치하지 않습니다.");
            }

            // 회원가입 처리
            memberService.registerMember(memberFormDto);

            // 인증 정보 삭제 (재사용 방지)
            emailVerificationService.removeVerified(memberFormDto.getEmail());

            return ResponseEntity.ok("회원가입이 완료되었습니다.");
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }


    /**
     * ID로 사용자 정보 조회
     * @param id - 사용자 ID
     * @return 사용자 정보 또는 에러 메시지를 포함한 JSON 응답
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMemberById(@PathVariable("id") Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Member member = memberService.findById(id); // 사용자 정보 조회
            if (member == null) {
                response.put("status", "error");
                response.put("message", "사용자를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            response.put("status", "success");
            response.put("data", member); // 사용자 정보를 data 키로 반환
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 오류 발생");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    /*
        위 메소드의 반환결과가 다음과 같다.
        {
          "status": "success",
          "data": {
            "id": 102,
            "name": "김길동",
            "email": "test2@example.com",
            "phone": "010-2222-3333",
            "address": "서울시 강남구"
            // 기타 사용자 정보
          }
        }
     */

    /**
     * 사용자 정보 수정
     * @param id - 사용자 ID
     * @param memberUpdateDto - 수정할 사용자 정보 (MemberUpdateDto 사용)
     * @return 성공 또는 실패 메시지를 포함한 JSON 응답
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMember(@PathVariable("id") Long id,
                                                            @Valid @RequestBody MemberUpdateDto memberUpdateDto, // MemberUpdateDto 사용
                                                            HttpServletResponse response) {
        Map<String, Object> responseBody = new HashMap<>();
        try {
            // 1. 사용자 정보 DB 업데이트
            memberService.updateMember(id, memberUpdateDto); // MemberUpdateDto 사용

            // 2. 업데이트된 사용자 정보 조회
            Member updatedMember = memberService.findById(id);
            if (updatedMember == null) {
                responseBody.put("status", "error");
                responseBody.put("message", "사용자를 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(responseBody);
            }

            // 3. 새로운 액세스 토큰 생성
            String newAccessToken = tokenProvider.generateToken(
                    updatedMember.getEmail(),
                    //updatedMember.getAuthorities(),
                    //updatedMember.getName(),
                    Duration.ofMinutes(1) // 액세스 토큰 유효 기간
            );

            // 4. 새로운 리프레시 토큰 생성
            String newRefreshToken = tokenProvider.generateRefreshToken(
                    updatedMember.getEmail(),
                    Duration.ofDays(7) // 리프레시 토큰 유효 기간
            );

            // 5. 리프레시 토큰 DB 저장 또는 업데이트
            refreshTokenService.saveOrUpdateRefreshToken(updatedMember.getEmail(), newRefreshToken, updatedMember.getId());

            // 6. 액세스 토큰을 HttpOnly 쿠키로 설정
            Cookie accessTokenCookie = new Cookie("accToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false); // HTTPS 환경에서 true로 설정
            accessTokenCookie.setPath("/");
            response.addCookie(accessTokenCookie);

            // 7. 리프레시 토큰을 HttpOnly 쿠키로 설정
            Cookie refreshTokenCookie = new Cookie("refToken", newRefreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false); // HTTPS 환경에서 true로 설정
            refreshTokenCookie.setPath("/refresh");
            response.addCookie(refreshTokenCookie);

            // 8. 사용자 정보와 상태 반환
            responseBody.put("status", "success");
            responseBody.put("message", "사용자 정보가 수정되고 JWT가 갱신되었습니다.");
            responseBody.put("id", updatedMember.getId());
            responseBody.put("email", updatedMember.getEmail());
            responseBody.put("name", updatedMember.getName());
            responseBody.put("roles", updatedMember.getAuthorities());
            return ResponseEntity.ok(responseBody);
        } catch (IllegalArgumentException e) {
            responseBody.put("status", "error");
            responseBody.put("message", "잘못된 요청: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBody);
        } catch (Exception e) {
            responseBody.put("status", "error");
            responseBody.put("message", "서버 오류 발생");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(responseBody);
        }
    }


    /**
     * 이메일 중복 체크
     * @param email - 클라이언트에서 입력받은 이메일
     * @return 중복 여부 (200 OK로 항상 응답, 상태 값으로 판단)
     */
    @GetMapping("/checkEmail")
    public ResponseEntity<Map<String, Object>> checkEmail(@RequestParam("email") String email) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isDuplicate = memberService.isEmailDuplicate(email);

            if (isDuplicate) {
                response.put("status", "duplicate");
                response.put("message", "이미 존재하는 이메일입니다.");
            } else {
                response.put("status", "available");
                response.put("message", "사용 가능한 이메일입니다.");
            }

            return ResponseEntity.ok(response); // 항상 200 OK 반환
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "이메일 중복 체크 중 오류 발생: " + e.getMessage());
            return ResponseEntity.ok(response); // 오류도 200 OK로 응답
        }
    }



    /**
     * 로그인 처리[미사용-일반 시큐리티 로그인]
     * @param loginForm - 클라이언트에서 전송한 로그인 데이터
     * @return 성공 메시지 또는 에러 메시지
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginMember(@RequestBody LoginFormDto loginForm) {
        Map<String, String> response = new HashMap<>();

        // 로그인 성공 여부 확인
        boolean isLoginSuccessful = memberService.login(loginForm);

        if (isLoginSuccessful) {
            // 로그인 성공 시 마지막 로그인 날짜 업데이트
            memberService.updateLastLogin(loginForm.getEmail());

            response.put("message", "로그인 성공");
            response.put("status", "success");
            return ResponseEntity.ok(response); // HTTP 200 OK
        }

        // 로그인 실패 처리
        response.put("message", "로그인 실패");
        response.put("status", "failed");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response); // HTTP 401 Unauthorized
    }

    /**
     * 사용자 검색 API (이름을 기반으로 검색)
     * @param query - 클라이언트에서 입력한 검색어
     * @return 사용자 목록 (JSON 형태)
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMembers(@RequestParam("query") String query) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Member> members = memberService.searchMembersByName(query);

            response.put("status", "success");
            response.put("data", members); // 검색된 사용자 목록 반환
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "사용자 검색 중 오류 발생: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 회원 탈퇴 API 추가
     */
    @PostMapping("/deactivate")
    public ResponseEntity<String> deactivateMember(@RequestParam String email) {
        memberService.deactivateMember(email);
        return ResponseEntity.ok("회원 탈퇴 완료");
    }

    /**
     * 파비콘 요청 무시
     */
    @GetMapping("/favicon.ico")
    @ResponseBody
    void disableFavicon() {
        // 아무 작업도 하지 않음
    }

    /**
     * [추가] 회원 목록 조회 (페이징, 검색 기능 포함)
     * @param pageRequestDTO - 페이징 및 검색 조건
     * @return 페이징된 회원 목록 및 페이징 정보
     */
    @GetMapping
    public ResponseEntity<PageResponseDTO<Member>> getMemberList(PageRequestDTO pageRequestDTO) {
        PageResponseDTO<Member> responseDTO = memberService.getMemberList(pageRequestDTO);
        return ResponseEntity.ok(responseDTO);
    }

    /**
     * [추가] 회원 상태 변경 (활성/탈퇴) API
     * @param memberId - 회원 ID
     * @param status - 변경할 상태 (ACTIVE: 활성, DELETED: 탈퇴)
     * @return 성공 메시지
     */
    @PatchMapping("/{memberId}/status")
    public ResponseEntity<Map<String, Object>> changeMemberStatus(@PathVariable("memberId") Long memberId,
                                                                  @RequestParam("status") String status) {
        Map<String, Object> response = new HashMap<>();
        try {
            memberService.changeMemberStatus(memberId, status);
            response.put("status", "success");
            response.put("message", "회원 상태가 변경되었습니다.");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "서버 오류 발생");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
