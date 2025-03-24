package com.orbit.event.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 입찰 관련 알림 DTO
 * - 웹소켓을 통해 클라이언트에게 전송되는, 입찰 관련 알림 데이터
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingNotificationDto {
    private String type; // 알림 유형 (BIDDING_CREATED, SUPPLIER_INVITED 등)
    private String title; // 알림 제목
    private String content; // 알림 내용
    private String priority; // 알림 우선순위 (HIGH, NORMAL, LOW)
    private Long referenceId; // 참조 ID (입찰ID, 계약ID 등)
    private String referenceType; // 참조 타입 (BIDDING, CONTRACT, PARTICIPATION 등)
    private LocalDateTime createdAt; // 알림 생성 시간
    private boolean read; // 읽음 여부
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now(); // 시간 기록
}