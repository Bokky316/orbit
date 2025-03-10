package com.orbit.dto.procurement;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class GoodsRequestDTO extends PurchaseRequestDTO {

    @Valid
    @NotEmpty(message = "물품 정보는 최소 하나 이상 입력해야 합니다.")
    private List<PurchaseRequestItemDTO> items;
}
