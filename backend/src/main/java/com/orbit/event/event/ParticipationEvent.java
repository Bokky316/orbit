package com.orbit.event.event;

import org.springframework.context.ApplicationEvent;

import com.orbit.entity.bidding.BiddingParticipation;

import lombok.Getter;

/**
 * 입찰 참여 관련 이벤트
 */
@Getter
public class ParticipationEvent extends ApplicationEvent {
    private final BiddingParticipation participation;
    private final Long participationId;
    private final EventType eventType;

    public ParticipationEvent(Object source, BiddingParticipation participation, EventType eventType) {
        super(source);
        this.participation = participation;
        this.participationId = participation.getId();
        this.eventType = eventType;
    }

    public enum EventType {
        NEW,        // 새로운 참여
        CONFIRMED,  // 참여 확정
        UPDATED,    // 참여 정보 수정
        WITHDRAWN   // 참여 철회
    }
}