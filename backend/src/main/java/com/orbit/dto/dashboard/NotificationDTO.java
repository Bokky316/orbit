package com.orbit.dto.dashboard;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String title;
    private String content;
    private LocalDateTime timestamp;
    private Boolean isRead;
    private NotificationType type;
    private Long relatedEntityId;

    public enum NotificationType {
        PURCHASE_REQUEST,
        APPROVAL,
        BUDGET,
        SYSTEM,
        CATALOG_UPDATE
    }
}