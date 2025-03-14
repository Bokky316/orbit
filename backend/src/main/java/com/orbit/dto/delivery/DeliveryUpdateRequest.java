package com.orbit.dto.delivery;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryUpdateRequest {
    private LocalDate deliveryDate;
    private Long receiverId;
    private String deliveryItemId;
    private BigDecimal totalAmount;
    private String notes;
} 