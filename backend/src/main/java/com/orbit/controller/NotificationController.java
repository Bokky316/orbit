package com.orbit.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.member.Member;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.NotificationService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final MemberRepository memberRepository;

    // 사용자 알림 목록 조회
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member user = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        List<NotificationDto> notifications = notificationService.getNotificationsForUser(user.getId());
        return ResponseEntity.ok(notifications);
    }

    // 읽지 않은 알림 개수 조회
    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadNotificationsCount(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member user = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        long unreadCount = notificationService.countUnreadNotifications(user.getId());
        return ResponseEntity.ok(unreadCount);
    }

    // 읽지 않은 알림 목록 조회
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnreadNotifications(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Member user = memberRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        List<NotificationDto> notifications = notificationService.getUnreadNotifications(user.getId());
        return ResponseEntity.ok(notifications);
    }

    // 특정 유형 알림 조회
    @GetMapping("/type/{type}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByType(
        @PathVariable String type
    ) {
        List<NotificationDto> notifications = notificationService.getNotificationsByType(type);
        return ResponseEntity.ok(notifications);
    }

    // 특정 엔티티 관련 알림 조회
    @GetMapping("/related/{relatedId}")
    public ResponseEntity<List<NotificationDto>> getNotificationsByRelatedId(
        @PathVariable Long relatedId
    ) {
        List<NotificationDto> notifications = notificationService.getNotificationsByRelatedId(relatedId);
        return ResponseEntity.ok(notifications);
    }

    // 알림 읽음 처리
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(
        @PathVariable Long id
    ) {
        notificationService.markNotificationAsRead(id);
        return ResponseEntity.noContent().build();
    }

    // 알림 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
        @PathVariable Long id
    ) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}
