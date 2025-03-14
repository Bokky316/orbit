package com.orbit.dto.commonCode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParentCodeDTO {
    private Long id;
    private String entityType;
    private String codeGroup;
    private String codeName;
    private List<ChildCodeDTO> childCodes;
}