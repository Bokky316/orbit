package com.orbit.event.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BiddingStatusEventDto {
    private Long biddingId;
    private String fromStatus;
    private String toStatus;
    private String changedBy;
    private LocalDateTime changedAt;
}