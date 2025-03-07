package com.orbit.service.inspection;

import com.orbit.entity.inspection.Inspection;
import com.orbit.repository.bidding.SimplifiedContractRepository;
import com.orbit.repository.inspection.InspectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InspectionService {
    private final InspectionRepository inspectionRepository;
    private final SimplifiedContractRepository contractRepository;

    public List<Inspection> getAllInspections() {
        return inspectionRepository.findAll();
    }

    public Optional<Inspection> getInspectionById(Long id) {
        return inspectionRepository.findById(id);
    }

    public Inspection createInspection(Inspection inspection) {
        // 계약 존재 여부 확인
        contractRepository.findById(inspection.getContract().getId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 계약입니다."));

        return inspectionRepository.save(inspection);
    }

    public void deleteInspection(Long id) {
        if (!inspectionRepository.existsById(id)) {
            throw new IllegalArgumentException("존재하지 않는 검수 기록입니다.");
        }
        inspectionRepository.deleteById(id);
    }

    public List<Inspection> getInspectionsByInspector(Long inspectorId) {
        return inspectionRepository.findByInspectorId(inspectorId);
    }
}
