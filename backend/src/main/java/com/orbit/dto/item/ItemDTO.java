package com.orbit.dto.item;

import com.orbit.entity.item.Item;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDTO {
    private String id;
    private String categoryId;
    private String categoryName;
    private String name;
    private String code;
    private String specification;
    private String unitCode;
    private String unitName;
    private BigDecimal standardPrice;
    private String description;
    private String useYn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ItemDTO from(Item entity) {
        if (entity == null) return null;

        return ItemDTO.builder()
                .id(entity.getId())
                .categoryId(entity.getCategory() != null ? entity.getCategory().getId() : null)
                .categoryName(entity.getCategory() != null ? entity.getCategory().getName() : null)
                .name(entity.getName())
                .code(entity.getCode())
                .specification(entity.getSpecification())
//                .unitCode(entity.getUnit() != null ? entity.getUnit().getId() : null)
//                .unitName(entity.getUnit() != null ? entity.getUnit().getName() : null)
                .standardPrice(entity.getStandardPrice())
                .description(entity.getDescription())
                .useYn(entity.getUseYn())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}