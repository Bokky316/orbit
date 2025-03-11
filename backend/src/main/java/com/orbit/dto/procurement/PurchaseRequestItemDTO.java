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

    private Long itemId; // Item ID 추가

    private String itemName;

    private String categoryName; // 카테고리명 추가

    private String unitParentCode; // 단위 부모 코드

    private String unitChildCode; // 단위 자식 코드

    private String specification;

    @Positive(message = "수량은 0보다 커야 합니다.")
    private Integer quantity;

    @Positive(message = "단가는 0보다 커야 합니다.")
    private BigDecimal unitPrice;

    private BigDecimal totalPrice;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate deliveryRequestDate;

    private String deliveryLocation;
}