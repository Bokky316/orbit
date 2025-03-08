package com.orbit.dto.procurement;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 구매 요청 항목 DTO
 */
@Getter
@Setter
public class PurchaseRequestItemDTO {

    @NotNull(message = "품목 ID는 필수 입력 값입니다.")
    private Long itemId; // 품목 ID

    @NotNull(message = "수량은 필수 입력 값입니다.")
    private Integer quantity; // 수량

    @NotNull(message = "단가는 필수 입력 값입니다.")
    private Double unitPrice; // 단가

    private Double supplyPrice; // 공급가액 (선택적)

    private Double vat; // 부가세 (선택적)

    private String itemName; // 품목명

    private String specification; // 사양

    private String unit; // 단위

    private LocalDate deliveryRequestDate; // 납품 요청일

    private String deliveryLocation; // 납품 장소
}
