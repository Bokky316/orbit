package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class PurchaseRequestItemDTO {

    private Long id;

    @Size(max = 255, message = "품목명은 최대 255자까지 입력 가능합니다.")
    private String itemName;

    private String specification;

    private String unit;

    @Positive(message = "수량은 0보다 커야 합니다.")
    private Integer quantity;

    @Positive(message = "단가는 0보다 커야 합니다.")
    private BigDecimal unitPrice;

    private BigDecimal totalPrice;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deliveryRequestDate;

    private String deliveryLocation;
}
