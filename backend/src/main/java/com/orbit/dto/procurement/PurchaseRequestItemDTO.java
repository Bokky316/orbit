
// 2. PurchaseRequestItemDTO.java 수정 - itemId 타입을 String으로 변경

package com.orbit.dto.procurement;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PurchaseRequestItemDTO {

    private Long id;

    // itemId 타입을 String으로 변경 (UUID 대응)
    private String itemId; // Item ID

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