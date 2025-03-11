package com.orbit.dto.commonCode;

import com.orbit.entity.commonCode.CommonCodeGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeGroupDTO {
    private String id;
    private String name;
    private String description;
    private String useYn;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<CommonCodeDTO> codes = new ArrayList<>();

    public static CommonCodeGroupDTO from(CommonCodeGroup entity) {
        if (entity == null) return null;

        return CommonCodeGroupDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .useYn(entity.getUseYn())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
