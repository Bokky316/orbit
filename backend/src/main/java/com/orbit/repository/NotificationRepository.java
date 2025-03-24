package com.orbit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.orbit.entity.notification.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);
    
    long countByRecipientIdAndIsReadFalse(Long recipientId);
    
    List<Notification> findByTypeOrderByCreatedAtDesc(String type);
    
    List<Notification> findByReferenceIdOrderByCreatedAtDesc(Long referenceId);
}