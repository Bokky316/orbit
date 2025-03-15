package com.orbit.dto.commonCode;

import java.util.List;

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
public class ParentCodeDTO {
    private Long id;
    private String entityType;
    private String codeGroup;
    private String codeName;
    private List<ChildCodeDTO> childCodes;
}