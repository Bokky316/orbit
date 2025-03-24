package com.orbit.entity.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 전송 요청 DTO 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String type;
    private Long referenceId;
    private String title;
    private String content;
    private Long recipientId;
    private String priority; // "HIGH", "NORMAL", "LOW"

}
