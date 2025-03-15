package com.orbit.entity;

import java.time.LocalDateTime;

import com.orbit.entity.member.Member;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 알림 엔티티
 * - 사용자에게 전달되는 알림을 관리
 */
@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 수신자 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;
    
    // 알림 정보
    @Column(name = "title", nullable = false, length = 255)
    private String title;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;
    
    // 알림 유형 (ENUM 사용)
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;
    
    // 관련 ID (입찰ID, 계약ID 등)
    @Column(name = "related_id")
    private Long relatedId;
    
    // 읽음 여부
    @Column(name = "is_read", nullable = false)
    private boolean isRead;
    
    // 생성일시
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * 알림 유형 열거형
     */
    public enum NotificationType {
        입찰공고,
        계약,
        평가,
        기타
    }
    
    /**
     * 알림 읽음 처리
     */
    public void markAsRead() {
        this.isRead = true;
    }
    
    /**
     * 엔티티 생성 시 호출되는 메서드
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
    
    /**
     * 입찰 관련 알림 생성 헬퍼 메서드
     */
    public static Notification createBiddingNotification(Member user, String title, String content, Long biddingId) {
        return Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(NotificationType.입찰공고)
                .relatedId(biddingId)
                .isRead(false)
                .build();
    }
    
    /**
     * 계약 관련 알림 생성 헬퍼 메서드
     */
    public static Notification createContractNotification(Member user, String title, String content, Long contractId) {
        return Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(NotificationType.계약)
                .relatedId(contractId)
                .isRead(false)
                .build();
    }
    
    /**
     * 평가 관련 알림 생성 헬퍼 메서드
     */
    public static Notification createEvaluationNotification(Member user, String title, String content, Long evaluationId) {
        return Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .type(NotificationType.평가)
                .relatedId(evaluationId)
                .isRead(false)
                .build();
    }
}