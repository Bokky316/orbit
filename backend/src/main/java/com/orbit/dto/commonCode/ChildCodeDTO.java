package com.orbit.dto.commonCode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChildCodeDTO {
    private Long id;
    private Long parentCodeId;
    private String codeValue;
    private String codeName;
}