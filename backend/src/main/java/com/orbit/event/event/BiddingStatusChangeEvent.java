package com.orbit.event.event;

import java.time.LocalDateTime;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class BiddingStatusChangeEvent extends ApplicationEvent {
    private final Long biddingId;
    private final String fromStatus;
    private final String toStatus;
    private final String changedBy;
    private final LocalDateTime changedAt;

    public BiddingStatusChangeEvent(Object source, Long biddingId, String fromStatus, String toStatus, String changedBy) {
        super(source);
        this.biddingId = biddingId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.changedAt = LocalDateTime.now();
    }
}