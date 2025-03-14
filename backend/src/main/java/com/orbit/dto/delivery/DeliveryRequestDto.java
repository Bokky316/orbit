package com.orbit.dto.delivery;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryRequestDto {
    @NotNull(message = "발주 ID는 필수입니다")
    private Long biddingOrderId;
    
    @NotNull(message = "공급업체 ID는 필수입니다")
    private Long supplierId;
    
    private String supplierName;
    
    @NotNull(message = "입고일은 필수입니다")
    private LocalDate deliveryDate;
    
    private Long receiverId;
    
    @NotNull(message = "품목 ID는 필수입니다")
    private String deliveryItemId;
    
    private BigDecimal totalAmount;
    
    private String notes;
} 