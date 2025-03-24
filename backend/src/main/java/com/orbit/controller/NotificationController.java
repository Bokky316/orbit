package com.orbit.controller;

import java.util.List;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.member.Member;
import com.orbit.service.member.MemberService;
import com.orbit.service.NotificationService;
import com.orbit.service.procurement.DepartmentService;
import com.orbit.service.procurement.PositionService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 웹소켓을 통한 알림 처리 컨트롤러
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class NotificationController {
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberService memberService;
    private final NotificationService notificationService;
    private final DepartmentService departmentService;
    private final PositionService positionService;

    /**
     * 클라이언트로부터 알림 확인 메시지 처리
     */
    @MessageMapping("/notification/read")
    public void markAsRead(NotificationDto notification) {
        log.info("알림 읽음 처리 - ID: {}, 사용자: {}", notification.getId(), notification.getRecipientId());
        notificationService.markNotificationAsRead(notification.getId());
    }

    /**
     * 특정 사용자에게 알림 전송
     */
    public void sendNotification(Long userId, NotificationDto notification) {
        log.debug("사용자에게 알림 전송 - 사용자: {}, 알림: {}", userId, notification.getTitle());
        try {
            Member member = memberService.findById(userId);
            messagingTemplate.convertAndSendToUser(
                member.getUsername(),
                "/queue/notifications",
                notification
            );
        } catch (Exception e) {
            log.error("사용자에게 알림 전송 실패 - ID: {}, 오류: {}", userId, e.getMessage());
        }
    }

    /**
     * 특정 부서에 알림 전송
     */
    public void sendNotificationToDepartment(Long departmentId, NotificationDto notification) {
        log.debug("부서에 알림 전송 - 부서: {}, 알림: {}", departmentId, notification.getTitle());
        try {
            // 부서 정보 조회
            departmentService.getDepartmentById(departmentId);
            
            // 해당 부서에 속한 멤버 검색 - 실제 구현 시 리포지토리에 메서드 추가 필요
            List<Member> departmentMembers = memberService.searchMembersByName("");
            
            for (Member member : departmentMembers) {
                messagingTemplate.convertAndSendToUser(
                    member.getUsername(),
                    "/queue/notifications",
                    notification
                );
            }
        } catch (Exception e) {
            log.error("부서에 알림 전송 실패 - 부서 ID: {}, 오류: {}", departmentId, e.getMessage());
        }
    }

    /**
     * 특정 권한/역할을 가진 사용자들에게 알림 전송
     */
    public void sendNotificationToRole(String role, NotificationDto notification) {
        log.debug("특정 역할에 알림 전송 - 역할: {}, 알림: {}", role, notification.getTitle());
        try {
            // 해당 역할을 가진 멤버 검색 - 실제 구현 시 리포지토리에 메서드 추가 필요
            List<Member> roleMembers = memberService.searchMembersByName("");
            
            for (Member member : roleMembers) {
                messagingTemplate.convertAndSendToUser(
                    member.getUsername(),
                    "/queue/notifications",
                    notification
                );
            }
        } catch (Exception e) {
            log.error("역할별 알림 전송 실패 - 역할: {}, 오류: {}", role, e.getMessage());
        }
    }

    /**
     * 특정 직급 이상의 사용자들에게 알림 전송
     */
    public void sendNotificationToPositionLevel(int minLevel, NotificationDto notification) {
        log.debug("직급별 알림 전송 - 최소 레벨: {}, 알림: {}", minLevel, notification.getTitle());
        try {
            // 특정 레벨 이상의 직급 목록 조회
            positionService.getPositionsByMinLevel(minLevel);
            
            // 해당 직급을 가진 멤버 검색 - 실제 구현 시 리포지토리에 메서드 추가 필요
            List<Member> levelMembers = memberService.searchMembersByName("");
            
            for (Member member : levelMembers) {
                messagingTemplate.convertAndSendToUser(
                    member.getUsername(),
                    "/queue/notifications",
                    notification
                );
            }
        } catch (Exception e) {
            log.error("직급별 알림 전송 실패 - 최소 레벨: {}, 오류: {}", minLevel, e.getMessage());
        }
    }

    /**
     * 모든 사용자에게 알림 전송 (브로드캐스트)
     */
    @SendTo("/topic/notifications/broadcast")
    public NotificationDto broadcastNotification(NotificationDto notification) {
        log.info("모든 사용자에게 알림 브로드캐스트 - 알림: {}", notification.getTitle());
        return notification;
    }
}