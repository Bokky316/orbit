package com.orbit.dto;

import java.time.LocalDateTime;

import com.orbit.entity.Notification;
import com.orbit.entity.Notification.NotificationType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String title;
    private String content;
    private NotificationType type;
    private Long relatedId;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static NotificationDto fromEntity(Notification notification) {
        return NotificationDto.builder()
            .id(notification.getId())
            .title(notification.getTitle())
            .content(notification.getContent())
            .type(notification.getType())
            .relatedId(notification.getRelatedId())
            .isRead(notification.isRead())
            .createdAt(notification.getCreatedAt())
            .build();
    }
}