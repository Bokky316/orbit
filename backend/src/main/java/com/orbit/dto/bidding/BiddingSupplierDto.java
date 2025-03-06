package com.orbit.dto.bidding;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiddingSupplierDto {
    private Long id;
    private Long biddingId;
    private Long supplierId;
    private Boolean notificationSent;
    private LocalDateTime notificationDate;
    private LocalDateTime createdAt;
}