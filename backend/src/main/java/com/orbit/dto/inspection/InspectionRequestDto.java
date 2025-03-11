package com.orbit.dto.inspection;

import com.orbit.entity.inspection.Inspection;
import com.orbit.entity.inspection.Inspection.InspectionResult;
import com.orbit.entity.inspection.Inspection.QuantityStatus;
import com.orbit.entity.inspection.Inspection.QualityStatus;
import com.orbit.entity.inspection.Inspection.PackagingStatus;
import com.orbit.entity.inspection.Inspection.SpecMatchStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 검수 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
public class InspectionRequestDto {
    private Long contractId;
    private Long inspectorId;
    private LocalDate inspectionDate;
    private InspectionResult result;
    private String comments;
    private QuantityStatus quantityStatus;
    private QualityStatus qualityStatus;
    private PackagingStatus packagingStatus;
    private SpecMatchStatus specMatchStatus;

    // DTO -> Entity 변환
    public Inspection toEntity() {
        Inspection inspection = new Inspection();
        inspection.setContractId(this.contractId);
        inspection.setInspectorId(this.inspectorId);
        inspection.setInspectionDate(this.inspectionDate);
        inspection.setResult(this.result);
        inspection.setComments(this.comments);
        inspection.setQuantityStatus(this.quantityStatus);
        inspection.setQualityStatus(this.qualityStatus);
        inspection.setPackagingStatus(this.packagingStatus);
        inspection.setSpecMatchStatus(this.specMatchStatus);
        return inspection;
    }
}
