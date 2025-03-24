package com.orbit.event.event;

import java.time.LocalDateTime;

import org.springframework.context.ApplicationEvent;

import com.orbit.entity.bidding.BiddingContract;

import lombok.Getter;

/**
 * 계약 상태 변경 이벤트
 */
@Getter
public class ContractStatusChangeEvent extends ApplicationEvent {
    private final BiddingContract contract;
    private final Long contractId;
    private final String fromStatus;
    private final String toStatus;
    private final String changedBy;
    private final String reason;
    private final LocalDateTime changedAt;

    public ContractStatusChangeEvent(Object source, BiddingContract contract, 
                                    String fromStatus, String toStatus, 
                                    String changedBy, String reason) {
        super(source);
        this.contract = contract;
        this.contractId = contract.getId();
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
        this.reason = reason;
        this.changedAt = LocalDateTime.now();
    }
}