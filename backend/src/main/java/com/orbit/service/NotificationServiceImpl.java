package com.orbit.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.notification.BulkNotificationRequest;
import com.orbit.entity.notification.Notification;
import com.orbit.entity.notification.NotificationRequest;
import com.orbit.exception.ResourceNotFoundException;
import com.orbit.repository.member.MemberRepository;
import com.orbit.repository.NotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 알림 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements com.orbit.service.NotificationService {

    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;

    /**
     * 알림 생성 및 발송
     */
    @Override
    public NotificationDto sendNotification(NotificationRequest request) {
        log.debug("알림 생성 요청 - 수신자: {}, 제목: {}", request.getRecipientId(), request.getTitle());
        
        // 알림 엔티티 생성
        Notification notification = Notification.builder()
                .type(request.getType())
                .referenceId(request.getReferenceId())
                .title(request.getTitle())
                .content(request.getContent())
                .recipientId(request.getRecipientId())
                .isRead(false)
                .priority(request.getPriority())
                .createdAt(LocalDateTime.now())
                .build();
        
        // 수신자 이름 설정 (있는 경우)
        if (request.getRecipientId() != null) {
            memberRepository.findById(request.getRecipientId())
                    .ifPresent(member -> notification.setRecipientName(member.getName()));
        }
        
        // 저장
        Notification savedNotification = notificationRepository.save(notification);
        log.info("알림 생성 완료 - ID: {}, 수신자: {}", savedNotification.getId(), savedNotification.getRecipientId());
        
        // DTO 변환 및 반환
        return convertToDto(savedNotification);
    }

    /**
     * 개별 파라미터로 알림 발송
     */
    @Override
    public NotificationDto sendNotification(Long recipientId, String type, String title, String content, Long referenceId) {
        NotificationRequest request = new NotificationRequest();
        request.setRecipientId(recipientId);
        request.setType(type);
        request.setTitle(title);
        request.setContent(content);
        request.setReferenceId(referenceId);
        
        return sendNotification(request);
    }

    /**
     * 사용자의 알림 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(Long userId) {
        log.debug("사용자 알림 목록 조회 - 사용자 ID: {}", userId);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 사용자의 읽지 않은 알림 개수 조회
     */
    @Override
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * 사용자의 읽지 않은 알림 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        log.debug("사용자 읽지 않은 알림 목록 조회 - 사용자 ID: {}", userId);
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 알림 읽음 처리
     */
    @Override
    public void markNotificationAsRead(Long notificationId) {
        log.debug("알림 읽음 처리 - 알림 ID: {}", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다. ID: " + notificationId));
        
        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    /**
     * 알림 삭제
     */
    @Override
    public void deleteNotification(Long notificationId) {
        log.debug("알림 삭제 - 알림 ID: {}", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("알림을 찾을 수 없습니다. ID: " + notificationId));
        
        notificationRepository.delete(notification);
    }

    /**
     * 특정 타입의 알림 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsByType(String type) {
        log.debug("타입별 알림 목록 조회 - 타입: {}", type);
        return notificationRepository.findByTypeOrderByCreatedAtDesc(type).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 특정 참조 ID의 알림 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsByRelatedId(Long relatedId) {
        log.debug("관련 ID별 알림 목록 조회 - 관련 ID: {}", relatedId);
        return notificationRepository.findByReferenceIdOrderByCreatedAtDesc(relatedId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 다수 사용자에게 동일한 알림 전송
     */
    @Override
    public List<NotificationDto> sendBulkNotifications(BulkNotificationRequest request) {
        log.debug("대량 알림 발송 - 수신자 수: {}, 제목: {}", 
                request.getRecipientIds() != null ? request.getRecipientIds().size() : 0, 
                request.getTitle());
        
        List<NotificationDto> results = new ArrayList<>();
        
        if (request.getRecipientIds() != null && !request.getRecipientIds().isEmpty()) {
            for (Long recipientId : request.getRecipientIds()) {
                NotificationRequest individualRequest = new NotificationRequest();
                individualRequest.setRecipientId(recipientId);
                individualRequest.setType(request.getType());
                individualRequest.setTitle(request.getTitle());
                individualRequest.setContent(request.getContent());
                individualRequest.setReferenceId(request.getReferenceId());
                individualRequest.setPriority(request.getPriority());
                
                NotificationDto result = sendNotification(individualRequest);
                results.add(result);
            }
        }
        
        return results;
    }

    /**
     * 특정 역할을 가진 모든 사용자에게 알림 전송
     */
    @Override
    public List<NotificationDto> sendNotificationsByRole(NotificationRequest request, String role) {
        log.debug("역할별 알림 발송 - 역할: {}, 제목: {}", role, request.getTitle());
        
        // 역할별 회원 ID 조회 - 실제 구현 시 적절한 메서드 추가 필요
        List<Long> userIds = new ArrayList<>(); // memberRepository.findByRole(role)...
        
        BulkNotificationRequest bulkRequest = new BulkNotificationRequest();
        bulkRequest.setType(request.getType());
        bulkRequest.setTitle(request.getTitle());
        bulkRequest.setContent(request.getContent());
        bulkRequest.setReferenceId(request.getReferenceId());
        bulkRequest.setRecipientIds(userIds);
        bulkRequest.setPriority(request.getPriority());
        
        return sendBulkNotifications(bulkRequest);
    }

    /**
     * 구매자(BUYER) 역할을 가진 모든 사용자에게 알림 전송
     */
    @Override
    public List<NotificationDto> sendNotificationToBuyers(NotificationRequest request) {
        log.debug("구매자 역할 알림 발송 - 제목: {}", request.getTitle());
        return sendNotificationsByRole(request, "BUYER");
    }
    
    /**
     * Notification 엔티티를 DTO로 변환
     */
    private NotificationDto convertToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .referenceId(notification.getReferenceId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .recipientId(notification.getRecipientId())
                .recipientName(notification.getRecipientName())
                .isRead(notification.isRead())
                .priority(notification.getPriority())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}