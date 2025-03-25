package com.orbit.dto.dashboard;

import java.time.LocalDateTime;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDTO {
    private Long id;
    private ActivityType type;
    private String title;
    private String description;
    private LocalDateTime timestamp;

    public enum ActivityType {
        PURCHASE_REQUEST_SUBMIT,
        PURCHASE_REQUEST_APPROVAL,
        BUDGET_USAGE,
        ITEM_RECEIPT,
        SYSTEM_UPDATE
    }
}