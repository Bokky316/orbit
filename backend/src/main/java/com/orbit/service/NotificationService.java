package com.orbit.service;

import java.util.List;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.Notification;
import com.orbit.entity.Notification.NotificationType;

public interface NotificationService {
    // 사용자별 알림 조회
    List<NotificationDto> getNotificationsForUser(Long userId);
    
    // 읽지 않은 알림 개수 조회
    long countUnreadNotifications(Long userId);
    
    // 읽지 않은 알림 목록 조회
    List<NotificationDto> getUnreadNotifications(Long userId);
    
    // 특정 유형 알림 조회
    List<NotificationDto> getNotificationsByType(String type);
    
    // 특정 엔티티 관련 알림 조회
    List<NotificationDto> getNotificationsByRelatedId(Long relatedId);
    
    // 알림 읽음 처리
    void markNotificationAsRead(Long notificationId);
    
    // 알림 삭제
    void deleteNotification(Long notificationId);
    
    // 알림 생성 메서드들
    Notification createNotification(
        Long userId, 
        String title, 
        String content, 
        NotificationType type, 
        Long relatedId
    );
}
