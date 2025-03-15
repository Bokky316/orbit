package com.orbit.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.orbit.dto.NotificationDto;
import com.orbit.entity.Notification;
import com.orbit.entity.Notification.NotificationType;
import com.orbit.entity.member.Member;
import com.orbit.repository.NotificationRepository;
import com.orbit.repository.member.MemberRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(Long userId) {
        List<Notification> notifications = notificationRepository
            .findByUserIdOrderByCreatedAtDesc(userId);
        
        return notifications.stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(Long userId) {
        List<Notification> notifications = notificationRepository
            .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        
        return notifications.stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsByType(String type) {
        List<Notification> notifications = notificationRepository
            .findByTypeOrderByCreatedAtDesc(type);
        
        return notifications.stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsByRelatedId(Long relatedId) {
        List<Notification> notifications = notificationRepository
            .findByRelatedIdOrderByCreatedAtDesc(relatedId);
        
        return notifications.stream()
            .map(NotificationDto::fromEntity)
            .collect(Collectors.toList());
    }

    @Override
    public void markNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new EntityNotFoundException("알림을 찾을 수 없습니다."));
        
        notification.markAsRead();
        notificationRepository.save(notification);
    }

    @Override
    public void deleteNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new EntityNotFoundException("알림을 찾을 수 없습니다."));
        
        notificationRepository.delete(notification);
    }

    @Override
    public Notification createNotification(
        Long userId, 
        String title, 
        String content, 
        NotificationType type, 
        Long relatedId
    ) {
        Member user = memberRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        
        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .content(content)
            .type(type)
            .relatedId(relatedId)
            .isRead(false)
            .build();
        
        return notificationRepository.save(notification);
    }
}
