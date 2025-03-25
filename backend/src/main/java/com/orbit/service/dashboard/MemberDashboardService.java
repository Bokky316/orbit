package com.orbit.service.dashboard;

import com.orbit.dto.NotificationDto;
import com.orbit.dto.dashboard.*;
import com.orbit.dto.member.MemberDTO;
import com.orbit.dto.procurement.PurchaseRequestDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestDashboardDTO;
import com.orbit.dto.procurement.dashboard.PurchaseRequestSummaryDTO;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.procurement.PurchaseRequestRepository;
import com.orbit.service.NotificationService;
import com.orbit.service.procurement.PurchaseRequestDashboardService;
import com.orbit.service.procurement.PurchaseRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberDashboardService {

    private final MemberRepository memberRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestService purchaseRequestService;
    private final PurchaseRequestDashboardService purchaseRequestDashboardService;
    private final NotificationService notificationService;

    /**
     * 개인 대시보드 데이터 조회
     * @param username 사용자 로그인 ID
     * @return 개인화된 대시보드 DTO
     */
    public MemberDashboardDTO getMemberDashboard(String username) {
        // 1. 회원 정보 조회
        Member member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 구매요청 현황 조회
        List<PurchaseRequestDTO> memberPurchaseRequests = purchaseRequestRepository.findByMemberUsername(username)
                .stream()
                .map(purchaseRequestService::convertToDto)
                .collect(Collectors.toList());

        // 3. 구매요청 상태별 집계
        Map<String, Long> requestStatusCount = memberPurchaseRequests.stream()
                .collect(Collectors.groupingBy(
                        req -> req.getStatus() != null ? req.getStatus() : "UNKNOWN",
                        Collectors.counting()
                ));

        // 4. 예산 현황 조회 (부서 기준)
        PurchaseRequestDashboardDTO departmentBudgetInfo = purchaseRequestDashboardService.getDashboardData();

        // 5. 최근 알림 조회 (최근 10건)
        List<NotificationDto> notifications = notificationService.getNotificationsForUser(member.getId());

        // 6. 최근 활동 조회 (구매요청 기준)
        List<RecentActivityDTO> recentActivities = memberPurchaseRequests.stream()
                .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                .limit(5)
                .map(req -> RecentActivityDTO.builder()
                        .id(req.getId())
                        .type(req.getStatus().contains("COMPLETED") ?
                                RecentActivityDTO.ActivityType.PURCHASE_REQUEST_APPROVAL :
                                RecentActivityDTO.ActivityType.PURCHASE_REQUEST_SUBMIT)
                        .title(req.getRequestName())
                        .description(req.getRequestNumber() + " (" + req.getBusinessBudget() + "원)")
                        .timestamp(req.getRequestDate().atStartOfDay())
                        .build())
                .collect(Collectors.toList());

        // 7. 최근 구매요청 조회 (최근 5건)
        List<PurchaseRequestSummaryDTO> recentRequests = memberPurchaseRequests.stream()
                .sorted((a, b) -> b.getRequestDate().compareTo(a.getRequestDate()))
                .limit(5)
                .map(req -> {
                    PurchaseRequestSummaryDTO summaryDTO = new PurchaseRequestSummaryDTO();
                    summaryDTO.setId(req.getId());
                    summaryDTO.setRequestName(req.getRequestName());
                    summaryDTO.setRequestNumber(req.getRequestNumber());
                    summaryDTO.setStatus(req.getStatus());
                    summaryDTO.setBusinessBudget(req.getBusinessBudget());
                    summaryDTO.setRequestDate(req.getRequestDate());
                    return summaryDTO;
                })
                .collect(Collectors.toList());

        // 8. 승인 대기 중인 구매요청 조회
        List<PurchaseRequestDTO> pendingApprovals = memberPurchaseRequests.stream()
                .filter(req -> req.getStatus() != null && req.getStatus().contains("PENDING"))
                .collect(Collectors.toList());

        // 9. 대시보드 DTO 구성
        return MemberDashboardDTO.builder()
                .memberInfo(MemberDTO.builder()
                        .id(member.getId())
                        .name(member.getName())
                        .build())
                .purchaseRequestStats(PurchaseRequestStatsDTO.builder()
                        .totalRequests(requestStatusCount.getOrDefault("TOTAL", 0L))
                        .inProgressRequests(requestStatusCount.getOrDefault("IN_PROGRESS", 0L))
                        .completedRequests(requestStatusCount.getOrDefault("COMPLETED", 0L))
                        .rejectedRequests(requestStatusCount.getOrDefault("REJECTED", 0L))
                        .build())
                .recentRequests(recentRequests)
                .pendingApprovals(pendingApprovals)
                .notifications(notifications.stream()
                        .map(noti -> {
                            NotificationDTO dto = new NotificationDTO();
                            dto.setId(noti.getId());
                            dto.setTitle(noti.getTitle());
                            dto.setContent(noti.getContent());
                            dto.setTimestamp(noti.getCreatedAt());
                            dto.setIsRead(noti.isRead());
                            return dto;
                        })
                        .collect(Collectors.toList()))
                .recentActivities(recentActivities)
                .build();
    }
}