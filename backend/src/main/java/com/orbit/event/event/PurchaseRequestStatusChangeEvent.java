package com.orbit.event.event;

import java.time.LocalDateTime;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class PurchaseRequestStatusChangeEvent extends ApplicationEvent {
    private final Long purchaseRequestId;
    private final String fromStatus;
    private final String toStatus;
    private final String changedBy;
    private final LocalDateTime changedAt;

    public PurchaseRequestStatusChangeEvent(Object source,
                                            Long purchaseRequestId,
                                            String fromStatus,
                                            String toStatus,
                                            String changedBy) {
        super(source);
        this.purchaseRequestId = purchaseRequestId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.changedAt = LocalDateTime.now();
    }
}