package com.orbit.event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierStatusEventDTO {
    private Long supplierId;
    private String fromStatus;
    private String toStatus;
    private String changedBy;
    private LocalDateTime timestamp;
}
