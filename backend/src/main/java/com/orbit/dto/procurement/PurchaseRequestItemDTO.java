
// 2. PurchaseRequestItemDTO.java 수정 - itemId 타입을 String으로 변경

package com.orbit.dto.procurement;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 구매 요청 항목 DTO
 */
@Getter
@Setter
public class PurchaseRequestItemDTO {

    private Long id;

    // itemId 타입을 String으로 변경 (UUID 대응)
    private String itemId; // Item ID

    private String itemName;

    private Double supplyPrice; // 공급가액 (선택적)

    private Double vat; // 부가세 (선택적)

    private String itemName; // 품목명

    private String specification; // 사양

    private String unit; // 단위

    private LocalDate deliveryRequestDate; // 납품 요청일

    private String deliveryLocation; // 납품 장소
}
