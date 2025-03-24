package com.orbit.service.bidding;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.orbit.event.dto.BiddingStatusEventDto;
import com.orbit.event.dto.BiddingNotificationDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 웹소켓 메시지 서비스
 * - WebSocket을 통해 입찰 상태 변경 및 알림을 클라이언트에게 전송
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BiddingWebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 입찰 상태 변경 이벤트를 WebSocket으로 전송
     * - /topic/bidding/{biddingId} 토픽으로 메시지 전송
     * - 해당 토픽을 구독하고 있는 클라이언트에게 메시지 전달
     * @param event 입찰 상태 변경 이벤트 DTO
     */
    public void sendStatusUpdateEvent(BiddingStatusEventDto event) {
        log.debug("입찰 상태 변경 이벤트 웹소켓 전송 - 입찰 ID: {}, {} -> {}", 
                event.getBiddingId(), event.getFromStatus(), event.getToStatus());
        
        // 입찰 ID에 대한 토픽으로 메시지 전송
        messagingTemplate.convertAndSend(
                "/topic/bidding/" + event.getBiddingId() + "/status",
                event
        );
        
        // 변경자가 있으면 해당 사용자에게도 개인 메시지 전송
        if (event.getChangedBy() != null) {
            messagingTemplate.convertAndSendToUser(
                event.getChangedBy(),
                "/queue/bidding-updates",
                event
            );
        }
    }
    
    /**
     * 입찰 공고에 새로운 공급사가 초대되었을 때 알림
     * @param biddingId 입찰 공고 ID
     * @param supplierDto 초대된 공급사 정보
     */
    public void sendSupplierInvitedEvent(Long biddingId, Object supplierDto) {
        log.debug("공급사 초대 이벤트 웹소켓 전송 - 입찰 ID: {}", biddingId);
        
        messagingTemplate.convertAndSend(
                "/topic/bidding/" + biddingId + "/suppliers",
                supplierDto
        );
    }
    
    /**
     * 입찰 공고에 새로운 참여가 있을 때 알림
     * @param biddingId 입찰 공고 ID
     * @param participationDto 참여 정보
     */
    public void sendParticipationEvent(Long biddingId, Object participationDto) {
        log.debug("참여 이벤트 웹소켓 전송 - 입찰 ID: {}", biddingId);
        
        messagingTemplate.convertAndSend(
                "/topic/bidding/" + biddingId + "/participations",
                participationDto
        );
    }
    
    /**
     * 낙찰자 선정 알림
     * @param biddingId 입찰 공고 ID
     * @param winnerDto 낙찰자 정보
     */
    public void sendWinnerSelectedEvent(Long biddingId, Object winnerDto) {
        log.debug("낙찰자 선정 이벤트 웹소켓 전송 - 입찰 ID: {}", biddingId);
        
        messagingTemplate.convertAndSend(
                "/topic/bidding/" + biddingId + "/winner",
                winnerDto
        );
    }
    
    /**
     * 계약 관련 이벤트 알림
     * @param biddingId 입찰 공고 ID
     * @param contractDto 계약 정보
     */
    public void sendContractEvent(Long biddingId, Object contractDto) {
        log.debug("계약 이벤트 웹소켓 전송 - 입찰 ID: {}", biddingId);
        
        messagingTemplate.convertAndSend(
                "/topic/bidding/" + biddingId + "/contract",
                contractDto
        );
    }
    
    /**
     * 개인 알림 전송
     * @param username 사용자명
     * @param notification 알림 정보
     */
    public void sendPersonalNotification(String username, BiddingNotificationDto notification) {
        log.debug("개인 알림 웹소켓 전송 - 사용자: {}, 제목: {}", username, notification.getTitle());
        
        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                notification
        );
    }
}