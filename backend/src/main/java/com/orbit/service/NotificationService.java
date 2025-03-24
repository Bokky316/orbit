package com.orbit.service;

import java.util.List;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.notification.BulkNotificationRequest;
import com.orbit.entity.notification.Notification;
import com.orbit.entity.notification.NotificationRequest;

/**
 * 알림 서비스 인터페이스
 */
public interface NotificationService {

    /**
     * 알림 발송 (NotificationRequest 객체 사용)
     */
    NotificationDto sendNotification(NotificationRequest request);
    
    /**
     * 알림 발송 (개별 파라미터)
     */
    NotificationDto sendNotification(Long recipientId, String type, String title, String content, Long referenceId);

    /**
     * 사용자의 알림 목록 조회
     * @param userId 사용자 ID
     * @return 알림 목록
     */
    List<NotificationDto> getNotificationsForUser(Long userId);

    /**
     * 사용자의 읽지 않은 알림 개수 조회
     * @param userId 사용자 ID
     * @return 읽지 않은 알림 개수
     */
    long countUnreadNotifications(Long userId);

    /**
     * 사용자의 읽지 않은 알림 목록 조회
     * @param userId 사용자 ID
     * @return 읽지 않은 알림 목록
     */
    List<NotificationDto> getUnreadNotifications(Long userId);

    /**
     * 알림 읽음 처리
     * @param notificationId 알림 ID
     */
    void markNotificationAsRead(Long notificationId);

    /**
     * 알림 삭제
     * @param notificationId 알림 ID
     */
    void deleteNotification(Long notificationId);

    /**
     * 특정 타입의 알림 조회
     * @param type 알림 타입
     * @return 알림 목록
     */
    List<NotificationDto> getNotificationsByType(String type);

    /**
     * 특정 참조 ID의 알림 조회
     * @param relatedId 참조 ID
     * @return 알림 목록
     */
    List<NotificationDto> getNotificationsByRelatedId(Long relatedId);

    /**
     * 다수 사용자에게 동일한 알림 전송
     * @param request 대량 알림 요청 정보
     * @return 생성된 알림 목록
     */
    List<NotificationDto> sendBulkNotifications(BulkNotificationRequest request);

    /**
     * 특정 역할을 가진 모든 사용자에게 알림 전송
     * @param request 알림 요청 정보
     * @param role 사용자 역할
     * @return 생성된 알림 목록
     */
    List<NotificationDto> sendNotificationsByRole(NotificationRequest request, String role);
    
    /**
     * 구매자(BUYER) 역할을 가진 모든 사용자에게 알림 전송
     * @param request 알림 요청 정보
     * @return 생성된 알림 목록
     */
    List<NotificationDto> sendNotificationToBuyers(NotificationRequest request);
}