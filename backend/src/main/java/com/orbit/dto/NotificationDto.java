package com.orbit.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 정보 DTO 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String type;
    private Long referenceId;
    private String title;
    private String content;
    private Long recipientId;
    private String recipientName;
    private boolean isRead;
    private String priority;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}