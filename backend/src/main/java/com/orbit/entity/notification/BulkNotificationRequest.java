package com.orbit.entity.notification;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 대량 알림 전송 요청 DTO 클래스
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkNotificationRequest {
    private String type;
    private Long referenceId;
    private String title;
    private String content;
    private List<Long> recipientIds;
    private String priority; // "HIGH", "NORMAL", "LOW"
}
