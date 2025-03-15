package com.orbit.dto.commonCode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Builder
@Setter @Getter
@NoArgsConstructor
@AllArgsConstructor
public class ChildCodeDTO {
    private Long id;
    private Long parentCodeId;
    private String codeValue;
    private String codeName;
}