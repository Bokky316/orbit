package com.orbit.dto.item;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.orbit.entity.item.Item;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    // ✅ 변경: 단위 코드 필드명 수정
    private String unitParentCode;  // ParentCode.codeGroup
    private String unitChildCode;   // ChildCode.codeValue

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

                // ✅ 추가: 단위 코드 매핑
                .unitParentCode(
                        entity.getUnitParentCode() != null ?
                                entity.getUnitParentCode().getCodeGroup() : null
                )
                .unitChildCode(
                        entity.getUnitChildCode() != null ?
                                entity.getUnitChildCode().getCodeValue() : null
                )

                .standardPrice(entity.getStandardPrice())
                .description(entity.getDescription())
                .useYn(entity.getUseYn())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}