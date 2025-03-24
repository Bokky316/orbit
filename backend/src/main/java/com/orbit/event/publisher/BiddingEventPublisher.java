package com.orbit.event.publisher;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import com.orbit.entity.bidding.Bidding;
import com.orbit.entity.bidding.BiddingContract;
import com.orbit.entity.bidding.BiddingParticipation;
import com.orbit.event.dto.BiddingStatusEventDto;
import com.orbit.event.event.BiddingStatusChangeEvent;
import com.orbit.event.event.ContractStatusChangeEvent;
import com.orbit.event.event.ParticipationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 입찰 관련 이벤트 발행 컴포넌트
 * - 입찰, 계약, 참여 등 관련 이벤트를 발행하는 중앙 컴포넌트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BiddingEventPublisher {
    private final ApplicationEventPublisher applicationEventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 입찰 상태 변경 이벤트 발행
     * - ApplicationEventPublisher를 통해 이벤트 발행
     */
    public void publishStatusChangeEvent(Long biddingId, String fromStatus, String toStatus, String changedBy) {
        log.debug("입찰 상태 변경 이벤트 발행 - 입찰 ID: {}, {} -> {}", biddingId, fromStatus, toStatus);
        
        BiddingStatusChangeEvent event = new BiddingStatusChangeEvent(
                this, biddingId, fromStatus, toStatus, changedBy);
                
        applicationEventPublisher.publishEvent(event);
    }

    /**
     * 계약 상태 변경 이벤트 발행
     */
    public void publishContractStatusChangeEvent(BiddingContract contract, String fromStatus, 
                                                 String toStatus, String changedBy, String reason) {
        log.debug("계약 상태 변경 이벤트 발행 - 계약 ID: {}, {} -> {}", 
                contract.getId(), fromStatus, toStatus);
                
        ContractStatusChangeEvent event = new ContractStatusChangeEvent(
                this, contract, fromStatus, toStatus, changedBy, reason);
                
        applicationEventPublisher.publishEvent(event);
    }
    
    /**
     * 참여 이벤트 발행
     */
    public void publishParticipationEvent(BiddingParticipation participation, 
                                         ParticipationEvent.EventType eventType) {
        log.debug("참여 이벤트 발행 - 참여 ID: {}, 이벤트 유형: {}", 
                participation.getId(), eventType);
                
        ParticipationEvent event = new ParticipationEvent(this, participation, eventType);
        applicationEventPublisher.publishEvent(event);
    }

    /**
     * Redis Pub/Sub 채널로 입찰 상태 변경 이벤트 발행
     * - 분산 환경에서의 실시간 이벤트 전파를 위한 채널
     */
    public void publishStatusChangeToRedis(BiddingStatusEventDto event) {
        log.debug("Redis에 입찰 상태 변경 이벤트 발행 - 입찰 ID: {}", event.getBiddingId());
        redisTemplate.convertAndSend("bidding_status_channel", event);
    }
    
    /**
     * Redis Pub/Sub 채널로 계약 관련 이벤트 발행
     */
    public void publishContractEventToRedis(String channelName, Object event) {
        log.debug("Redis에 계약 이벤트 발행 - 채널: {}", channelName);
        redisTemplate.convertAndSend(channelName, event);
    }
}