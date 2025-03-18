package com.orbit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * 특정 사용자의 읽지 않은 알림 개수 조회
     */
    long countByUserIdAndIsReadFalse(Long userId);
    
    /**
     * 특정 사용자의 모든 알림 조회 (최신순)
     */
    java.util.List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    /**
     * 특정 사용자의 읽지 않은 알림 조회 (최신순)
     */
    java.util.List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    
    /**
     * 특정 유형의 알림 조회
     */
    java.util.List<Notification> findByTypeOrderByCreatedAtDesc(String type);
    
    /**
     * 특정 엔티티 관련 알림 조회
     */
    java.util.List<Notification> findByRelatedIdOrderByCreatedAtDesc(Long relatedId);
}