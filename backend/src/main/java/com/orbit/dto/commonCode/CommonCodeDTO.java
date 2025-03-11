package com.orbit.dto.commonCode;

import com.orbit.entity.commonCode.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeDTO {
    private String id;
    private String groupId;
    private String groupName;
    private String name;
    private String value;
    private Integer sortOrder;
    private String description;
    private String useYn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CommonCodeDTO from(CommonCode entity) {
        if (entity == null) return null;

        return CommonCodeDTO.builder()
                .id(entity.getId())
                .groupId(entity.getGroup() != null ? entity.getGroup().getId() : null)
                .groupName(entity.getGroup() != null ? entity.getGroup().getName() : null)
                .name(entity.getName())
                .value(entity.getValue())
                .sortOrder(entity.getSortOrder())
                .description(entity.getDescription())
                .useYn(entity.getUseYn())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}