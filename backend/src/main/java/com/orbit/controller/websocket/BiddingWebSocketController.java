package com.orbit.controller.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import com.orbit.entity.member.Member;
import com.orbit.event.dto.BiddingStatusEventDto;
import com.orbit.event.publisher.BiddingEventPublisher;
import com.orbit.repository.member.MemberRepository;
import com.orbit.service.bidding.BiddingAuthorizationService;
import com.orbit.service.bidding.BiddingService;
import com.orbit.util.BiddingUtils;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 웹소켓 컨트롤러
 * - 클라이언트의 웹소켓 메시지를 처리하고 응답을 반환
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class BiddingWebSocketController {
    private final BiddingService biddingService;
    private final MemberRepository memberRepository;
    private final BiddingAuthorizationService authorizationService;
    private final BiddingEventPublisher eventPublisher;

    /**
     * 입찰 상태 변경 웹소켓 핸들러
     * - 클라이언트가 /app/bidding/{id}/status로 메시지 전송 시 호출
     * - 결과는 /topic/bidding/{id}로 브로드캐스트
     */
    @MessageMapping("/bidding/{id}/status")
    @SendTo("/topic/bidding/{id}/status")
    public BiddingStatusEventDto updateStatus(
            @DestinationVariable Long id,
            BiddingStatusEventDto event
    ) {
        log.info("웹소켓을 통한 입찰 상태 변경 요청 - ID: {}, {} -> {}", 
                id, event.getFromStatus(), event.getToStatus());
        
        // 현재 인증된 사용자 정보 가져오기
        Member currentMember = BiddingUtils.getCurrentMember(
                SecurityContextHolder.getContext().getAuthentication(), memberRepository);
        
        // 권한 확인
        if (!authorizationService.canChangeBiddingStatus(
                currentMember, event.getFromStatus(), event.getToStatus())) {
            log.warn("입찰 상태 변경 권한 없음 - 사용자: {}, 직급: {}", 
                    currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new SecurityException("입찰 공고 상태 변경 권한이 없습니다.");
        }

        // 상태 변경 로직 호출 (통합적인 상태 변경 이벤트가 발생함)
        biddingService.changeBiddingStatus(
                id, 
                event.getToStatus(), 
                "WebSocket을 통한 상태 변경: " + event.getFromStatus() + " → " + event.getToStatus()
        );

        // 응답 이벤트 설정 (단순히 클라이언트에게 ACK 용도)
        event.setChangedBy(currentMember.getUsername());
        event.setChangedAt(java.time.LocalDateTime.now());
        
        log.info("입찰 상태 변경 성공 - ID: {}, {} -> {}", id, event.getFromStatus(), event.getToStatus());

        return event;
    }
    
    /**
     * 입찰 공고의 현재 상태 조회
     * - 클라이언트가 /app/bidding/{id}/current-status를 구독할 때 호출
     */
    @SubscribeMapping("/bidding/{id}/current-status")
    public BiddingStatusEventDto getCurrentStatus(@DestinationVariable Long id) {
        log.debug("입찰 공고 현재 상태 구독 - ID: {}", id);
        
        // 입찰 공고 상태 조회
        String status = biddingService.getBiddingStatus(id);
        
        // 현재 상태 정보로 이벤트 생성하여 반환
        return BiddingStatusEventDto.builder()
                .biddingId(id)
                .toStatus(status)
                .changedAt(java.time.LocalDateTime.now())
                .build();
    }
    
    /**
     * 공급사 초대 웹소켓 핸들러
     * - 클라이언트가 /app/bidding/{id}/invite-supplier로 메시지 전송 시 호출
     */
    @MessageMapping("/bidding/{id}/invite-supplier")
    public void inviteSupplier(@DestinationVariable Long id, Long supplierId) {
        log.info("웹소켓을 통한 공급사 초대 요청 - 입찰 ID: {}, 공급사 ID: {}", id, supplierId);
        
        // 현재 인증된 사용자 정보 가져오기
        Member currentMember = BiddingUtils.getCurrentMember(
                SecurityContextHolder.getContext().getAuthentication(), memberRepository);
        
        // 입찰 공고 상태 확인하고 초대 권한 확인
        String status = biddingService.getBiddingStatus(id);
        if (!authorizationService.canInviteSupplier(currentMember, status)) {
            log.warn("공급사 초대 권한 없음 - 사용자: {}, 직급: {}", 
                    currentMember.getUsername(), currentMember.getPosition().getLevel());
            throw new SecurityException("공급사 초대 권한이 없습니다.");
        }
        
        // 공급사 초대 로직 호출 (BiddingService에서 별도의 이벤트가 발생할 것)
        biddingService.inviteSupplier(id, supplierId);
        
        log.info("공급사 초대 성공 - 입찰 ID: {}, 공급사 ID: {}", id, supplierId);
    }
    
    /**
     * 웹소켓 알림 읽음 처리
     * - 클라이언트가 /app/bidding/notification/read로 메시지 전송 시 호출
     */
    @MessageMapping("/bidding/notification/read")  // 경로 변경
    public void markNotificationAsRead(Long notificationId) {
        log.debug("알림 읽음 처리 요청 - 알림 ID: {}", notificationId);
        
        // 현재 인증된 사용자 정보 가져오기
        Member currentMember = BiddingUtils.getCurrentMember(
                SecurityContextHolder.getContext().getAuthentication(), memberRepository);
        
        // 알림 읽음 처리 로직 호출
        // notificationService.markAsRead(notificationId, currentMember);
    }
}