package com.orbit.event.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestStatusEventDTO {
    private Long purchaseRequestId;
    private String fromStatus;
    private String toStatus;
    private LocalDateTime changedAt;
    private String changedBy;
    private String comment;
}