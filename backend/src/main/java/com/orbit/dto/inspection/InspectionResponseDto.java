package com.orbit.dto.inspection;

import com.orbit.entity.inspection.Inspection;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 검수 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class InspectionResponseDto {
    private Long id;
    private Long contractId;
    private Long inspectorId;
    private LocalDate inspectionDate;
    private String result;
    private String comments;
    private String quantityStatus;
    private String qualityStatus;
    private String packagingStatus;
    private String specMatchStatus;

    // Entity -> DTO 변환
    public static InspectionResponseDto fromEntity(Inspection inspection) {
        InspectionResponseDto dto = new InspectionResponseDto();
        dto.setId(inspection.getId());
        dto.setContractId(inspection.getContractId());
        dto.setInspectorId(inspection.getInspectorId());
        dto.setInspectionDate(inspection.getInspectionDate());
        dto.setResult(inspection.getResult().name());
        dto.setComments(inspection.getComments());
        dto.setQuantityStatus(inspection.getQuantityStatus().name());
        dto.setQualityStatus(inspection.getQualityStatus().name());
        dto.setPackagingStatus(inspection.getPackagingStatus().name());
        dto.setSpecMatchStatus(inspection.getSpecMatchStatus().name());
        return dto;
    }
}