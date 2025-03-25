package com.orbit.controller.dashboard;

import com.orbit.dto.dashboard.MemberDashboardDTO;
import com.orbit.service.dashboard.MemberDashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class MemberDashboardController {

    private final MemberDashboardService memberDashboardService;

    /**
     * 개인 대시보드 데이터 조회
     * @return 개인화된 대시보드 데이터
     */
    @GetMapping("/me")
    public ResponseEntity<MemberDashboardDTO> getMemberDashboard() {
        // 현재 인증된 사용자의 username 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        log.info("대시보드 데이터 조회 요청: 사용자 {}", username);

        // 대시보드 서비스를 통해 데이터 조회
        MemberDashboardDTO dashboardData = memberDashboardService.getMemberDashboard(username);

        return ResponseEntity.ok(dashboardData);
    }
}