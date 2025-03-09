package com.orbit.dto.inspection;

import com.orbit.entity.inspection.Inspections;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionsDto {
    private Long id;
    private String contractNumber;  // 계약 번호
    private String inspectorName;   // 검수자 이름
    private LocalDate inspectionDate;
    private String result;
    private String comments;

    public static InspectionsDto fromEntity(Inspections inspection) {
        return InspectionsDto.builder()
                .id(inspection.getId())
                .contractNumber(inspection.getContract().getTransactionNumber())
                .inspectorName(inspection.getInspector().getName())
                .inspectionDate(inspection.getInspectionDate())
                .result(inspection.getResult() != null ? inspection.getResult().toString() : "검수대기")
                .comments(inspection.getComments())
                .build();
    }
}
